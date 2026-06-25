/**
 * PostgreSQL 连接池配置
 * 使用 Drizzle ORM + node-postgres (pg) 驱动
 *
 * 连接池参数：
 * - min: 2 个空闲连接
 * - max: 20 个最大并发连接
 * - idleTimeoutMillis: 30 秒空闲超时
 * - connectionTimeoutMillis: 5 秒连接超时
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { DatabaseError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 2,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// 监听连接池错误，记录日志并抛出 503 错误
pool.on("error", (err) => {
  logger.error(
    { event: "database_pool_error", error: err.message },
    "PostgreSQL 连接池发生意外错误"
  );
});

/**
 * 获取连接池中的一个客户端连接
 * 连接失败时抛出 DatabaseError (503)
 */
export async function getPoolClient() {
  try {
    return await pool.connect();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown connection error";
    logger.error(
      { event: "database_connection_failed", error: message },
      "无法建立 PostgreSQL 连接"
    );
    throw new DatabaseError("数据库服务暂时不可用", 503);
  }
}

/** Drizzle ORM 实例，基于连接池 */
export const db = drizzle(pool);

/** 导出连接池以便测试和生命周期管理 */
export { pool };

// ─── 数据库重试逻辑 ─────────────────────────────────────────────────────────

/**
 * 延迟指定毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 瞬态错误代码集合
 * - ECONNRESET: TCP 连接被对端重置
 * - ETIMEDOUT: 连接或操作超时
 * - 57P01: PostgreSQL "admin_shutdown" — 服务器正在关闭
 */
const TRANSIENT_ERROR_CODES: ReadonlySet<string> = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "57P01",
]);

/**
 * 判断错误是否为瞬态错误（网络中断、超时、服务器关闭）
 * 瞬态错误可以通过重试恢复，非瞬态错误（约束违规、无效数据）应立即返回
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    return typeof code === "string" && TRANSIENT_ERROR_CODES.has(code);
  }
  return false;
}

/**
 * 数据库操作重试包装器
 *
 * 策略：
 * - 瞬态错误（ECONNRESET, ETIMEDOUT, 57P01）：等待 500ms 后重试一次
 * - 非瞬态错误（约束违规、无效数据等）：立即抛出，不重试
 *
 * 所有数据库操作应通过此函数执行，配合参数化查询防止 SQL 注入
 *
 * @param operation - 返回 Promise 的数据库操作函数
 * @param requestId - 请求追踪 ID，用于日志关联
 * @returns 操作结果
 * @throws 非瞬态错误立即抛出；瞬态错误重试一次后仍失败则抛出
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  requestId: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isTransientError(error)) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown transient error";
      logger.warn(
        { requestId, error: errorMessage, event: "database_transient_error" },
        "Transient DB error, retrying in 500ms"
      );
      await sleep(500);
      return await operation();
    }
    throw error;
  }
}
