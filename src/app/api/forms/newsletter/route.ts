/**
 * Newsletter 订阅 API 路由
 *
 * 端点: POST /api/forms/newsletter
 *
 * 功能：
 * - 接收邮箱地址，创建 Newsletter 订阅
 * - Redis 缓存查重（避免重复查询 PostgreSQL）
 * - 幂等处理：已订阅邮箱返回成功，不创建重复记录
 * - 新订阅异步触发欢迎邮件
 * - 非 POST 方法返回 405
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import {
  createFormMiddlewarePipeline,
  addCorsHeaders,
  type RequestContext,
} from "@/lib/middleware";
import { checkRateLimit } from "@/lib/redis/rate-limiter";
import { getCachedEmailStatus, setCachedEmailStatus } from "@/lib/redis/cache";
import { WebhookService } from "@/lib/webhook";
import { newsletterSchema } from "@/lib/validation/schemas";
import { sanitizeInput } from "@/lib/validation/sanitizer";
import { db, withRetry } from "@/lib/db";
import { newsletterSubscriptions } from "@/lib/db/schema";
import { fireWelcomeEmail } from "@/lib/email";
import {
  logSuccess,
  logValidationFailed,
  logPersistenceFailed,
} from "@/lib/logger";
import { logValidationFailure } from "@/lib/security-logger";
import { RateLimitError } from "@/lib/errors";
import { ERROR_CODES, FORM_TYPES } from "@/types/api";
import type { ErrorResponse, SuccessResponse } from "@/types/api";

// ─── 常量 ────────────────────────────────────────────────────────────────────────

const FORM_TYPE = FORM_TYPES.NEWSLETTER;

// ─── POST 处理 ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. 执行标准中间件管道（请求 ID、客户端 IP、CORS、方法检查、Content-Type）
  const context: RequestContext = {
    requestId: "",
    clientIp: "",
    locale: "zh",
  };

  const middlewarePipeline = createFormMiddlewarePipeline();
  const middlewareResponse = await middlewarePipeline(request, context);
  if (middlewareResponse) {
    return middlewareResponse;
  }

  const { requestId, clientIp } = context;

  try {
    // 2. 频率限制检查
    const retryAfter = await checkRateLimit(clientIp, FORM_TYPE, requestId);
    if (retryAfter !== null) {
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/newsletter",
        method: "POST",
        rule: "rate_limit_exceeded",
        timestamp: new Date().toISOString(),
      });
      throw new RateLimitError(retryAfter);
    }

    // 3. 解析 JSON 请求体
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logValidationFailed(requestId, FORM_TYPE, "json_parse_failed", { clientIp });
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/newsletter",
        method: "POST",
        rule: "json_parse_failed",
        timestamp: new Date().toISOString(),
      });
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "请求体必须为有效的 JSON 格式",
        },
      };
      return addCorsHeaders(NextResponse.json(errorResponse, { status: 400 }));
    }

    // 4. Zod 验证
    const parseResult = newsletterSchema.safeParse(body);
    if (!parseResult.success) {
      const fields: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const fieldPath = issue.path.join(".");
        fields[fieldPath] = issue.message;
      }

      logValidationFailed(requestId, FORM_TYPE, "newsletter_validation_failed", {
        fields,
        clientIp,
      });
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/newsletter",
        method: "POST",
        rule: "schema_validation_failed",
        timestamp: new Date().toISOString(),
      });

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "表单验证失败，请检查标记的字段",
          fields,
        },
      };
      return addCorsHeaders(NextResponse.json(errorResponse, { status: 400 }));
    }

    // 消毒并规范化邮箱
    const email = sanitizeInput(parseResult.data.email).toLowerCase().trim();

    // 5. 检查 Redis 缓存：邮箱是否已订阅
    const cachedStatus = await getCachedEmailStatus(email, requestId);
    if (cachedStatus === true) {
      // 缓存命中：已订阅，直接返回成功（幂等）
      logSuccess(requestId, FORM_TYPE, "newsletter_subscription_idempotent", {
        email,
        source: "cache",
      });

      const successResponse: SuccessResponse = { success: true };
      return addCorsHeaders(NextResponse.json(successResponse, { status: 200 }));
    }

    // 6. 查询数据库：检查邮箱是否已存在
    const existing = await withRetry(
      () =>
        db
          .select({ id: newsletterSubscriptions.id })
          .from(newsletterSubscriptions)
          .where(eq(newsletterSubscriptions.email, email))
          .limit(1),
      requestId,
    );

    if (existing.length > 0) {
      // 数据库中已存在，缓存状态并返回成功（幂等）
      await setCachedEmailStatus(email, true, requestId);

      logSuccess(requestId, FORM_TYPE, "newsletter_subscription_idempotent", {
        email,
        source: "database",
      });

      const successResponse: SuccessResponse = { success: true };
      return addCorsHeaders(NextResponse.json(successResponse, { status: 200 }));
    }

    // 7. 新订阅：插入数据库
    const insertResult = await withRetry(
      () =>
        db
          .insert(newsletterSubscriptions)
          .values({ email })
          .returning({
            id: newsletterSubscriptions.id,
            unsubscribeToken: newsletterSubscriptions.unsubscribeToken,
          }),
      requestId,
    );

    const newSubscription = insertResult[0];
    if (!newSubscription) {
      logPersistenceFailed(requestId, FORM_TYPE, "newsletter_insert_failed", {
        email,
      });

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: "服务暂时不可用，请稍后再试",
        },
      };
      return addCorsHeaders(NextResponse.json(errorResponse, { status: 500 }));
    }

    // 缓存新订阅状态
    await setCachedEmailStatus(email, true, requestId);

    // 8. 异步触发欢迎邮件（非阻塞）
    fireWelcomeEmail(
      email,
      newSubscription.unsubscribeToken,
      context.locale,
      requestId,
    );

    // 8.1 异步触发 Webhook 即时通知（fire-and-forget）
    WebhookService.sendNotificationAsync({
      formType: FORM_TYPE,
      name: email,
      email,
      timestamp: new Date().toISOString(),
      summary: { action: "new_subscription" },
    });

    logSuccess(requestId, FORM_TYPE, "newsletter_subscription_created", {
      email,
      subscriptionId: newSubscription.id,
    });

    // 9. 返回成功响应
    const successResponse: SuccessResponse = { success: true };
    return addCorsHeaders(NextResponse.json(successResponse, { status: 200 }));
  } catch (error) {
    // 频率限制错误
    if (error instanceof RateLimitError) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: "请求过于频繁，请稍后再试",
        },
      };
      return addCorsHeaders(
        NextResponse.json(errorResponse, {
          status: 429,
          headers: { "Retry-After": String(error.retryAfter) },
        }),
      );
    }

    // 未预期的内部错误
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logPersistenceFailed(requestId, FORM_TYPE, "newsletter_unexpected_error", {
      error: errorMessage,
    });

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "服务暂时不可用，请稍后再试",
      },
    };
    return addCorsHeaders(NextResponse.json(errorResponse, { status: 500 }));
  }
}

// ─── 非 POST 方法返回 405 ────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed();
}

function methodNotAllowed(): NextResponse {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.METHOD_NOT_ALLOWED,
      message: "不允许的请求方法，请使用: POST",
    },
  };
  return NextResponse.json(errorResponse, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
