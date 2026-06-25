/**
 * API Key 认证中间件
 *
 * 职责：
 * - 从 X-API-Key 请求头获取 key 值
 * - 使用 crypto.timingSafeEqual 进行常量时间比较（防止 timing attack）
 * - ADMIN_API_KEY 未配置时返回 503（SERVICE_NOT_CONFIGURED）
 * - 认证失败记录 warn 日志（clientIp + requestPath + timestamp）
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import {
  type MiddlewareHandler,
  type RequestContext,
  composeMiddleware,
  requestIdMiddleware,
  clientIpMiddleware,
} from "@/lib/middleware";
import { ERROR_CODES } from "@/types/api";
import type { ErrorResponse } from "@/types/api";

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/** 构建标准化错误响应 */
function createErrorResponse(
  code: string,
  message: string,
  statusCode: number
): NextResponse {
  const body: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status: statusCode });
}

/**
 * 常量时间字符串比较
 * 使用 crypto.timingSafeEqual 防止 timing attack
 * 两个字符串长度不同时仍执行比较以保证恒定时间
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  // 长度不同时：仍然执行比较（使用 a 与 a 比较以保持恒定时间），但最终返回 false
  if (bufA.length !== bufB.length) {
    // 使用 bufA 与自身比较以消耗恒定时间，避免通过响应时间推断长度差异
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

// ─── 中间件实现 ──────────────────────────────────────────────────────────────────

/**
 * API Key 认证中间件
 *
 * 验证流程：
 * 1. 检查 ADMIN_API_KEY 环境变量是否已配置
 * 2. 从 X-API-Key 请求头获取客户端提供的 key
 * 3. 使用常量时间比较验证 key 是否匹配
 *
 * 短路条件：
 * - ADMIN_API_KEY 未配置 → 503 SERVICE_NOT_CONFIGURED
 * - X-API-Key 头缺失 → 401 UNAUTHORIZED "API key is required"
 * - X-API-Key 不匹配 → 401 UNAUTHORIZED "Invalid credentials"
 */
export function apiKeyGuardMiddleware(): MiddlewareHandler {
  return async (
    request: NextRequest,
    context: RequestContext
  ): Promise<NextResponse | null> => {
    // 1. 检查 ADMIN_API_KEY 是否已配置
    const configuredKey = process.env.ADMIN_API_KEY;
    if (!configuredKey) {
      return createErrorResponse(
        ERROR_CODES.SERVICE_NOT_CONFIGURED,
        "Service is not properly configured",
        503
      );
    }

    // 2. 获取客户端提供的 API Key
    const providedKey = request.headers.get("x-api-key");

    if (!providedKey) {
      // 认证失败日志：缺少 API Key
      logger.warn(
        {
          clientIp: context.clientIp,
          requestPath: request.nextUrl.pathname,
          timestamp: new Date().toISOString(),
        },
        "Authentication failed: API key is missing"
      );

      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        "API key is required",
        401
      );
    }

    // 3. 常量时间比较
    const isValid = constantTimeEqual(providedKey, configuredKey);

    if (!isValid) {
      // 认证失败日志：无效 API Key
      logger.warn(
        {
          clientIp: context.clientIp,
          requestPath: request.nextUrl.pathname,
          timestamp: new Date().toISOString(),
        },
        "Authentication failed: Invalid credentials"
      );

      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        "Invalid credentials",
        401
      );
    }

    // 认证通过
    return null;
  };
}

// ─── Admin API 限流中间件 ────────────────────────────────────────────────────────

/** Admin API 限流配置：100 次/分钟/IP */
const ADMIN_RATE_LIMIT = {
  maxRequests: 100,
  windowSeconds: 60,
} as const;

/**
 * Admin API 频率限制中间件
 * 使用 Redis 滑动窗口，Redis 不可用时放行（与公开 API 行为一致）
 */
export function adminRateLimitMiddleware(): MiddlewareHandler {
  return async (
    request: NextRequest,
    context: RequestContext
  ): Promise<NextResponse | null> => {
    // 延迟导入避免循环依赖
    const { checkRateLimit } = await import("@/lib/redis/rate-limiter");

    const retryAfter = await checkRateLimit(
      context.clientIp,
      "admin",
      context.requestId
    );

    if (retryAfter !== null) {
      logger.warn(
        {
          clientIp: context.clientIp,
          requestPath: request.nextUrl.pathname,
          timestamp: new Date().toISOString(),
        },
        "Admin API rate limit exceeded"
      );

      return createErrorResponse(
        ERROR_CODES.RATE_LIMITED,
        "Too many requests, please try again later",
        429
      );
    }

    return null;
  };
}

// ─── 预构建管道 ──────────────────────────────────────────────────────────────────

/**
 * 创建管理 API 中间件管道
 * 执行顺序: requestId → clientIp → rateLimiter → apiKeyGuard
 *
 * @returns 组合后的中间件处理函数
 */
export function createAdminMiddlewarePipeline(): MiddlewareHandler {
  return composeMiddleware(
    requestIdMiddleware(),
    clientIpMiddleware(),
    adminRateLimitMiddleware(),
    apiKeyGuardMiddleware()
  );
}
