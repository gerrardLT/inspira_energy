/**
 * 健康检查服务
 *
 * 职责：
 * - 并行检查 PostgreSQL 和 Redis 连通性
 * - PostgreSQL：执行 SELECT 1，3 秒超时
 * - Redis：执行 PING，2 秒超时
 * - 聚合组件状态：全部 healthy → "healthy"(200)，任一 unhealthy → "degraded"(503)
 * - 报告各组件延迟和整体响应时间
 * - 从 package.json 读取应用版本号
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8
 */

import { pool } from "@/lib/db";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

export interface ComponentHealth {
  status: "healthy" | "unhealthy";
  error?: string;
  latencyMs: number;
}

export interface HealthCheckResult {
  status: "healthy" | "degraded";
  version: string;
  responseTimeMs: number;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
  };
}

// ─── 版本号读取 ──────────────────────────────────────────────────────────────────

// 使用 require 在模块加载时读取 package.json 的 version 字段
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version: appVersion } = require("../../../package.json") as { version: string };

// ─── 组件健康检查 ────────────────────────────────────────────────────────────────

/**
 * 创建超时 Promise，在指定毫秒后 reject
 */
function createTimeout(ms: number, label: string): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${label} health check timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * 检查 PostgreSQL 连通性
 * 执行 SELECT 1 查询，3 秒超时
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await Promise.race([
        client.query("SELECT 1"),
        createTimeout(3000, "PostgreSQL"),
      ]);
    } finally {
      client.release();
    }
    return {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown database error";
    logger.warn({ error: errorMessage, component: "database" }, "Database health check failed");
    return {
      status: "unhealthy",
      error: "Database connection failed",
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * 检查 Redis 连通性
 * 执行 PING 命令，2 秒超时
 */
async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await Promise.race([
      redis.ping(),
      createTimeout(2000, "Redis"),
    ]);
    return {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown Redis error";
    logger.warn({ error: errorMessage, component: "cache" }, "Redis health check failed");
    return {
      status: "unhealthy",
      error: "Cache connection failed",
      latencyMs: Date.now() - start,
    };
  }
}

// ─── 健康检查服务 ────────────────────────────────────────────────────────────────

export const HealthService = {
  /**
   * 执行所有组件健康检查
   *
   * - 两项检查并行执行（Promise.allSettled）
   * - 全部 healthy → 整体 "healthy"
   * - 任一 unhealthy → 整体 "degraded"
   */
  async check(): Promise<HealthCheckResult> {
    const start = Date.now();

    const [dbResult, redisResult] = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
    ]);

    // 解析 Promise.allSettled 结果
    const database: ComponentHealth =
      dbResult.status === "fulfilled"
        ? dbResult.value
        : { status: "unhealthy", error: dbResult.reason?.message ?? "Database check failed", latencyMs: Date.now() - start };

    const cache: ComponentHealth =
      redisResult.status === "fulfilled"
        ? redisResult.value
        : { status: "unhealthy", error: redisResult.reason?.message ?? "Redis check failed", latencyMs: Date.now() - start };

    // 聚合整体状态
    const allHealthy = database.status === "healthy" && cache.status === "healthy";

    return {
      status: allHealthy ? "healthy" : "degraded",
      version: appVersion,
      responseTimeMs: Date.now() - start,
      components: {
        database,
        cache,
      },
    };
  },
};
