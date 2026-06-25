/**
 * Redis 连接配置与优雅降级
 *
 * 功能：
 * - ioredis 客户端连接配置（lazyConnect, 5s 连接超时）
 * - 可用性追踪（connect/error 事件驱动）
 * - 当 Redis 不可用时，绕过缓存和限流，不阻塞请求
 * - Redis 重新连接后以新状态恢复（不保留先前 rate-limit 状态）
 *
 * Requirements: 8.1, 8.5, 8.6
 */

import Redis from "ioredis";
import { logger } from "@/lib/logger";

/**
 * Redis 客户端实例
 * - lazyConnect: 不在创建时立即连接，按需连接
 * - connectTimeout: 5 秒连接超时
 * - maxRetriesPerRequest: 1 次重试，避免长时间阻塞
 */
const redis = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  connectTimeout: 5_000,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

/** Redis 可用性标志 */
let isAvailable = false;

redis.on("connect", () => {
  isAvailable = true;
  logger.info("Redis connection established");
});

redis.on("ready", () => {
  isAvailable = true;
});

redis.on("error", (err: Error) => {
  if (isAvailable) {
    // 仅在状态变化时记录警告，避免日志洪泛
    logger.warn({ error: err.message }, "Redis unavailable, bypassing cache/rate-limit");
  }
  isAvailable = false;
});

redis.on("close", () => {
  isAvailable = false;
});

/**
 * 检查 Redis 是否当前可用
 */
function isRedisAvailable(): boolean {
  return isAvailable;
}

/**
 * Redis 优雅降级包装器
 *
 * 当 Redis 不可用或操作失败时，返回 fallback 值而非抛出错误。
 * 确保缓存/限流不可用时不会阻塞正常请求处理。
 *
 * @param cacheOperation - 需要执行的 Redis 操作
 * @param fallback - Redis 不可用时的降级返回值
 * @param requestId - 请求 ID，用于日志追踪
 * @returns Redis 操作结果或 fallback 值
 */
async function withCacheFallback<T>(
  cacheOperation: () => Promise<T>,
  fallback: T,
  requestId?: string,
): Promise<T> {
  if (!isRedisAvailable()) {
    logger.warn(
      { requestId },
      "Redis unavailable, bypassing cache/rate-limit",
    );
    return fallback;
  }

  try {
    return await cacheOperation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(
      { requestId, error: errorMessage },
      "Redis operation failed, using fallback",
    );
    return fallback;
  }
}

export { redis, isAvailable, isRedisAvailable, withCacheFallback };
