/**
 * 滑动窗口限流器
 *
 * 基于 Redis Sorted Set 实现精确滑动窗口算法：
 * - 每个 IP + formType 组合独立计数
 * - 窗口大小：60 秒
 * - 最大请求数：5 次
 * - 超出限制时返回需等待的秒数（向上取整）
 * - Redis 不可用时降级到内存级限流（宽松但非完全放行）
 *
 * Requirements: 8.2, 8.3
 */

import { redis, withCacheFallback } from "@/lib/redis";
import { RATE_LIMIT_CONFIG } from "@/types/api";
import { logger } from "@/lib/logger";

// ─── 内存级降级限流器 ───────────────────────────────────────────────────────────

/**
 * 简单内存 Map 限流器（Redis 不可用时的降级方案）
 * 使用固定窗口计数，比 Redis 滑动窗口宽松但能防止洪泛。
 * 限制：每 IP 每分钟最多 30 次请求（宽于 Redis 的 5 次，避免误杀）。
 */
const memoryRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MEMORY_RATE_LIMIT_MAX = 30;
const MEMORY_RATE_LIMIT_WINDOW_MS = 60_000;

/** 定期清理过期条目，防止内存泄漏 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryRateLimitMap) {
    if (now > entry.resetAt) {
      memoryRateLimitMap.delete(key);
    }
  }
}, 60_000);

/**
 * 内存级限流检查
 * @returns null 表示放行，number 表示需等待秒数
 */
function checkMemoryRateLimit(ip: string, formType: string): number | null {
  const key = `${formType}:${ip}`;
  const now = Date.now();
  const entry = memoryRateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    memoryRateLimitMap.set(key, { count: 1, resetAt: now + MEMORY_RATE_LIMIT_WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > MEMORY_RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return Math.max(retryAfter, 1);
  }

  return null;
}

/**
 * 检查请求是否超出频率限制
 *
 * @param ip - 客户端 IP 地址
 * @param formType - 表单类型标识
 * @param requestId - 请求 ID，用于日志追踪
 * @returns null 表示通过（未超限），number 表示需要等待的秒数（正整数）
 */
export async function checkRateLimit(
  ip: string,
  formType: string,
  requestId?: string,
): Promise<number | null> {
  return withCacheFallback(
    () => performRateLimitCheck(ip, formType),
    checkMemoryRateLimit(ip, formType), // Redis 不可用时使用内存级限流
    requestId,
  );
}

/**
 * 执行实际的滑动窗口限流检查（Redis 操作）
 *
 * 算法流程：
 * 1. 移除窗口外的过期请求记录
 * 2. 添加当前请求（score = 当前时间戳，member = 唯一标识）
 * 3. 统计窗口内请求总数
 * 4. 设置 key 过期时间（窗口 + 1 秒，自动清理）
 * 5. 如果超出限制，计算最早请求何时滑出窗口
 */
async function performRateLimitCheck(
  ip: string,
  formType: string,
): Promise<number | null> {
  const key = `rate_limit:${formType}:${ip}`;
  const now = Date.now();
  const windowMs = RATE_LIMIT_CONFIG.windowSeconds * 1000;
  const windowStart = now - windowMs;

  // 使用 Redis pipeline 批量执行原子操作
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart); // 移除窗口外的过期记录
  pipeline.zadd(key, now.toString(), `${now}-${Math.random()}`); // 添加当前请求
  pipeline.zcard(key); // 统计窗口内请求数
  pipeline.expire(key, RATE_LIMIT_CONFIG.windowSeconds + 1); // 设置 key 自动过期

  const results = await pipeline.exec();

  // pipeline.exec() 返回 [error, result][] 格式
  if (!results) {
    // pipeline 执行失败，放行请求
    logger.warn("Rate limiter pipeline returned null, allowing request");
    return null;
  }

  // 检查 pipeline 中是否有错误
  const zcardResult = results[2];
  if (zcardResult && zcardResult[0]) {
    // zcard 命令出错，放行请求
    logger.warn(
      { error: (zcardResult[0] as Error).message },
      "Rate limiter zcard failed, allowing request",
    );
    return null;
  }

  const count = zcardResult?.[1] as number;

  if (count > RATE_LIMIT_CONFIG.maxRequests) {
    // 超出限制，计算需要等待的秒数
    const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");

    if (oldest.length >= 2) {
      const oldestTime = Number(oldest[1]);
      const retryAfterMs = oldestTime + windowMs - now;
      const retryAfter = Math.ceil(retryAfterMs / 1000);
      return Math.max(retryAfter, 1);
    }

    // 无法获取最早记录时，返回完整窗口等待时间
    return RATE_LIMIT_CONFIG.windowSeconds;
  }

  return null; // 未超限，放行
}
