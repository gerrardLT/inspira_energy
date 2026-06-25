/**
 * Property 11: 健康状态聚合逻辑
 *
 * 验证组件健康状态组合与整体状态的映射关系：
 * - 当所有组件（database, cache）均为 "healthy" 时 → 整体状态为 "healthy"（HTTP 200）
 * - 当任一组件为 "unhealthy" 时 → 整体状态为 "degraded"（HTTP 503）
 *
 * **Validates: Requirements 4.4, 4.5**
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ─── Mock 依赖模块 ──────────────────────────────────────────────────────────────

// 使用 vi.hoisted 声明 mock 对象，使其在 vi.mock 工厂函数中可引用
const { mockPool, mockRedis } = vi.hoisted(() => ({
  mockPool: {
    connect: vi.fn(),
  },
  mockRedis: {
    ping: vi.fn(),
  },
}));

// Mock package.json require（HealthService 内部通过 require 读取版本号）
vi.mock("../../../package.json", () => ({
  version: "0.1.0",
}));

// Mock @/lib/db
vi.mock("@/lib/db", () => ({
  pool: mockPool,
}));

// Mock @/lib/redis
vi.mock("@/lib/redis", () => ({
  redis: mockRedis,
}));

// ─── 导入被测模块 ───────────────────────────────────────────────────────────────

import { HealthService } from "@/lib/health/index";

// ─── Property Tests ──────────────────────────────────────────────────────────────

// Feature: backend-operations, Property 11: 健康状态聚合逻辑
describe("Feature: backend-operations, Property 11: 健康状态聚合逻辑", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("当所有组件均为 healthy 时，整体状态为 healthy", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dbHealthy: fc.constant(true),
          cacheHealthy: fc.constant(true),
        }),
        async () => {
          // 配置 mock：database healthy
          mockPool.connect.mockResolvedValue({
            query: vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
            release: vi.fn(),
          });

          // 配置 mock：cache healthy
          mockRedis.ping.mockResolvedValue("PONG");

          const result = await HealthService.check();

          // 所有组件 healthy → 整体 healthy
          expect(result.status).toBe("healthy");
          expect(result.components.database.status).toBe("healthy");
          expect(result.components.cache.status).toBe("healthy");
          expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
          expect(result.version).toBeTruthy();
          expect(typeof result.version).toBe("string");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("当任一组件为 unhealthy 时，整体状态为 degraded", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dbHealthy: fc.boolean(),
          cacheHealthy: fc.boolean(),
        }).filter(({ dbHealthy, cacheHealthy }) => !(dbHealthy && cacheHealthy)),
        async ({ dbHealthy, cacheHealthy }) => {
          // 配置 database mock
          if (dbHealthy) {
            mockPool.connect.mockResolvedValue({
              query: vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
              release: vi.fn(),
            });
          } else {
            mockPool.connect.mockRejectedValue(new Error("Connection refused"));
          }

          // 配置 cache mock
          if (cacheHealthy) {
            mockRedis.ping.mockResolvedValue("PONG");
          } else {
            mockRedis.ping.mockRejectedValue(new Error("Redis connection failed"));
          }

          const result = await HealthService.check();

          // 任一组件 unhealthy → 整体 degraded
          expect(result.status).toBe("degraded");

          // 验证各组件状态与预期一致
          if (dbHealthy) {
            expect(result.components.database.status).toBe("healthy");
          } else {
            expect(result.components.database.status).toBe("unhealthy");
            expect(result.components.database.error).toBeDefined();
          }

          if (cacheHealthy) {
            expect(result.components.cache.status).toBe("healthy");
          } else {
            expect(result.components.cache.status).toBe("unhealthy");
            expect(result.components.cache.error).toBeDefined();
          }

          // 验证 responseTimeMs 和 version 基本正确
          expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
          expect(result.version).toBeTruthy();
          expect(typeof result.version).toBe("string");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("对任意组件状态组合，整体状态符合聚合规则", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dbHealthy: fc.boolean(),
          cacheHealthy: fc.boolean(),
        }),
        async ({ dbHealthy, cacheHealthy }) => {
          // 配置 database mock
          if (dbHealthy) {
            mockPool.connect.mockResolvedValue({
              query: vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
              release: vi.fn(),
            });
          } else {
            mockPool.connect.mockRejectedValue(new Error("DB unavailable"));
          }

          // 配置 cache mock
          if (cacheHealthy) {
            mockRedis.ping.mockResolvedValue("PONG");
          } else {
            mockRedis.ping.mockRejectedValue(new Error("Cache unavailable"));
          }

          const result = await HealthService.check();

          // 核心属性：allHealthy ↔ status === "healthy"
          const allHealthy = dbHealthy && cacheHealthy;
          if (allHealthy) {
            expect(result.status).toBe("healthy");
          } else {
            expect(result.status).toBe("degraded");
          }

          // 各组件状态应与输入配置一致
          expect(result.components.database.status).toBe(
            dbHealthy ? "healthy" : "unhealthy",
          );
          expect(result.components.cache.status).toBe(
            cacheHealthy ? "healthy" : "unhealthy",
          );

          // responseTimeMs 是非负数
          expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);

          // version 是非空字符串
          expect(result.version.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
