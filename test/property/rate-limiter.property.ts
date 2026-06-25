/**
 * Property 7: Rate Limiter Sliding Window Enforcement
 *
 * 验证滑动窗口限流器的核心逻辑：
 * - 每个 IP + formType 组合在 60 秒窗口内允许最多 5 次请求
 * - 第 6 次及以后的请求返回正整数（需等待的秒数）
 * - 窗口过期后请求重新放行
 *
 * **Validates: Requirements 8.2, 8.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { RATE_LIMIT_CONFIG } from "@/types/api";

// ─── 内存模拟 Redis Sorted Set ──────────────────────────────────────────────────

/**
 * 模拟 Redis Sorted Set 操作的内存实现
 * 用于测试 rate limiter 的纯逻辑，无需真实 Redis 连接
 */
class MockRedisSortedSet {
  private store: Map<string, Array<{ score: number; member: string }>> = new Map();

  zremrangebyscore(key: string, min: number, max: number): number {
    const set = this.store.get(key) ?? [];
    const before = set.length;
    const filtered = set.filter((item) => item.score > max || item.score < min);
    this.store.set(key, filtered);
    return before - filtered.length;
  }

  zadd(key: string, score: number, member: string): number {
    const set = this.store.get(key) ?? [];
    set.push({ score, member });
    this.store.set(key, set);
    return 1;
  }

  zcard(key: string): number {
    return (this.store.get(key) ?? []).length;
  }

  zrange(key: string, start: number, stop: number): Array<{ score: number; member: string }> {
    const set = this.store.get(key) ?? [];
    // Sort by score ascending
    const sorted = [...set].sort((a, b) => a.score - b.score);
    return sorted.slice(start, stop + 1);
  }

  clear(): void {
    this.store.clear();
  }
}

// ─── 模拟 checkRateLimit 的纯逻辑实现 ───────────────────────────────────────────

/**
 * 模拟滑动窗口限流检查（与 src/lib/redis/rate-limiter.ts 逻辑一致）
 * 使用内存 sorted set 替代 Redis pipeline
 */
function createRateLimiter(mockRedis: MockRedisSortedSet) {
  return function checkRateLimit(
    ip: string,
    formType: string,
    now: number,
  ): number | null {
    const key = `rate_limit:${formType}:${ip}`;
    const windowMs = RATE_LIMIT_CONFIG.windowSeconds * 1000;
    const windowStart = now - windowMs;

    // 1. 移除窗口外的过期记录
    mockRedis.zremrangebyscore(key, 0, windowStart);

    // 2. 添加当前请求
    mockRedis.zadd(key, now, `${now}-${Math.random()}`);

    // 3. 统计窗口内请求数
    const count = mockRedis.zcard(key);

    if (count > RATE_LIMIT_CONFIG.maxRequests) {
      // 超出限制，计算需要等待的秒数
      const oldest = mockRedis.zrange(key, 0, 0);

      if (oldest.length >= 1) {
        const oldestTime = oldest[0].score;
        const retryAfterMs = oldestTime + windowMs - now;
        const retryAfter = Math.ceil(retryAfterMs / 1000);
        return Math.max(retryAfter, 1);
      }

      // 无法获取最早记录时，返回完整窗口等待时间
      return RATE_LIMIT_CONFIG.windowSeconds;
    }

    return null; // 未超限，放行
  };
}

// ─── Generators ──────────────────────────────────────────────────────────────────

/** 生成随机 IPv4 地址 */
const ipArb = fc.tuple(
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/** 生成随机表单类型 */
const formTypeArb = fc.constantFrom(
  "lp-interest",
  "developer",
  "contact-investor",
  "contact-general",
  "newsletter",
);

/** 生成请求序列长度 (1-20) */
const requestCountArb = fc.integer({ min: 1, max: 20 });

/** 生成窗口内的时间偏移序列（递增，在 60s 窗口内） */
function requestTimestampsArb(count: number) {
  return fc.array(
    fc.integer({ min: 0, max: RATE_LIMIT_CONFIG.windowSeconds * 1000 - 1 }),
    { minLength: count, maxLength: count },
  ).map((offsets) => offsets.sort((a, b) => a - b));
}

// ─── Property Tests ──────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 7: Rate Limiter Sliding Window Enforcement", () => {
  let mockRedis: MockRedisSortedSet;
  let checkRateLimit: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    mockRedis = new MockRedisSortedSet();
    checkRateLimit = createRateLimiter(mockRedis);
  });

  afterEach(() => {
    mockRedis.clear();
  });

  it("前 5 次请求应通过（返回 null）", () => {
    fc.assert(
      fc.property(
        ipArb,
        formTypeArb,
        (ip, formType) => {
          mockRedis.clear();
          const baseTime = Date.now();

          for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequests; i++) {
            const result = checkRateLimit(ip, formType, baseTime + i * 1000);
            expect(result).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("第 6 次及以后的请求在窗口内应返回正整数（秒数）", () => {
    fc.assert(
      fc.property(
        ipArb,
        formTypeArb,
        requestCountArb.filter((n) => n > RATE_LIMIT_CONFIG.maxRequests),
        (ip, formType, totalRequests) => {
          mockRedis.clear();
          const baseTime = Date.now();

          // 发送所有请求（间隔 1s 以保持在窗口内）
          for (let i = 0; i < totalRequests; i++) {
            const now = baseTime + i * 1000;
            const result = checkRateLimit(ip, formType, now);

            if (i < RATE_LIMIT_CONFIG.maxRequests) {
              // 前 5 次应通过
              expect(result).toBeNull();
            } else {
              // 第 6 次及以后应返回正整数
              expect(result).not.toBeNull();
              expect(result).toBeGreaterThan(0);
              expect(Number.isInteger(result)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("窗口过期后请求应重新放行", () => {
    fc.assert(
      fc.property(
        ipArb,
        formTypeArb,
        (ip, formType) => {
          mockRedis.clear();
          const baseTime = Date.now();
          const windowMs = RATE_LIMIT_CONFIG.windowSeconds * 1000;

          // 先填满 5 次请求（间隔 100ms）
          for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequests; i++) {
            checkRateLimit(ip, formType, baseTime + i * 100);
          }

          // 第 6 次在窗口内应被拒绝
          const lastRequestTime = baseTime + 500;
          const rejectedResult = checkRateLimit(ip, formType, lastRequestTime);
          expect(rejectedResult).not.toBeNull();
          expect(rejectedResult).toBeGreaterThan(0);

          // 窗口完全过期后：需要超过最后一个请求的时间 + 窗口大小
          // 最后一次成功请求在 baseTime + 400，第6次被拒在 baseTime + 500
          // 所有 6 条记录（包括被拒的那次也被 zadd 了）的最晚时间是 baseTime + 500
          // 需要 now - windowMs > baseTime + 500，即 now > baseTime + 500 + windowMs
          const afterWindowTime = lastRequestTime + windowMs + 1;
          const passedResult = checkRateLimit(ip, formType, afterWindowTime);
          expect(passedResult).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Retry-After 值不应超过窗口大小（60秒）", () => {
    fc.assert(
      fc.property(
        ipArb,
        formTypeArb,
        (ip, formType) => {
          mockRedis.clear();
          const baseTime = Date.now();

          // 快速发送超过限制的请求
          for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequests + 3; i++) {
            const result = checkRateLimit(ip, formType, baseTime + i * 100);

            if (result !== null) {
              expect(result).toBeGreaterThan(0);
              expect(result).toBeLessThanOrEqual(RATE_LIMIT_CONFIG.windowSeconds);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("不同 IP 的限流应独立计数", () => {
    fc.assert(
      fc.property(
        ipArb,
        ipArb.filter((ip) => ip !== "1.1.1.1"), // 确保两个 IP 不同
        formTypeArb,
        (ip1, ip2, formType) => {
          // 确保 IP 不同
          if (ip1 === ip2) return;

          mockRedis.clear();
          const baseTime = Date.now();

          // ip1 填满限制
          for (let i = 0; i < RATE_LIMIT_CONFIG.maxRequests; i++) {
            checkRateLimit(ip1, formType, baseTime + i * 100);
          }

          // ip1 第 6 次应被拒绝
          const ip1Result = checkRateLimit(ip1, formType, baseTime + 600);
          expect(ip1Result).not.toBeNull();

          // ip2 第 1 次应通过（独立计数）
          const ip2Result = checkRateLimit(ip2, formType, baseTime + 700);
          expect(ip2Result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
