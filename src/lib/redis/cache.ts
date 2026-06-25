/**
 * Newsletter 邮件订阅缓存服务
 *
 * 功能：
 * - 缓存 Newsletter 订阅邮箱的查重状态，避免重复查询 PostgreSQL
 * - 1 小时 TTL（3600 秒）
 * - 邮箱统一转小写后作为缓存键
 * - Redis 不可用时优雅降级（返回 null，不阻塞请求）
 *
 * Requirements: 8.4
 */

import { redis, withCacheFallback } from "@/lib/redis";

/** 缓存键前缀 */
const NEWSLETTER_EMAIL_PREFIX = "newsletter:email:";

/** 默认 TTL：1 小时（3600 秒） */
const DEFAULT_TTL_SECONDS = 3600;

/**
 * 规范化邮箱地址（统一转小写）
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * 构建缓存键
 */
function buildCacheKey(email: string): string {
  return `${NEWSLETTER_EMAIL_PREFIX}${normalizeEmail(email)}`;
}

/**
 * 从缓存获取邮箱订阅状态
 *
 * @param email - 邮箱地址
 * @param requestId - 可选请求 ID，用于日志追踪
 * @returns true 表示已订阅，false 表示未订阅，null 表示缓存未命中
 */
export async function getCachedEmailStatus(
  email: string,
  requestId?: string,
): Promise<boolean | null> {
  const key = buildCacheKey(email);

  return withCacheFallback(
    async () => {
      const value = await redis.get(key);
      if (value === null) {
        return null; // 缓存未命中
      }
      return value === "1";
    },
    null, // Redis 不可用时返回 null，触发 DB 查询
    requestId,
  );
}

/**
 * 将邮箱订阅状态写入缓存
 *
 * @param email - 邮箱地址
 * @param isSubscribed - 是否已订阅
 * @param requestId - 可选请求 ID，用于日志追踪
 * @param ttlSeconds - TTL 秒数，默认 3600（1 小时）
 */
export async function setCachedEmailStatus(
  email: string,
  isSubscribed: boolean,
  requestId?: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<void> {
  const key = buildCacheKey(email);
  const value = isSubscribed ? "1" : "0";

  await withCacheFallback(
    async () => {
      await redis.set(key, value, "EX", ttlSeconds);
    },
    undefined, // Redis 不可用时静默跳过
    requestId,
  );
}
