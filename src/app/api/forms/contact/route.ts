/**
 * 联系咨询表单 API Route Handler
 *
 * 支持两种咨询模式：
 * - investor（投资者咨询）：必填 name, company, email
 * - general（通用咨询）：必填 name, email, message
 *
 * 实现功能：
 * - 标准中间件管道（Request ID, CORS, 方法检查, Content-Type 检查）
 * - IP 维度滑动窗口限流（5 次/60s）
 * - Per-email 限流（5 次/10 分钟，Redis Sorted Set）
 * - 基于 form_type 的团队通知路由（investor → IR, general → support）
 * - 异步发送提交者确认邮件
 * - PostgreSQL 持久化（带瞬态错误重试）
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */

import { NextRequest, NextResponse } from "next/server";

import {
  createFormMiddlewarePipeline,
  addCorsHeaders,
  type RequestContext,
} from "@/lib/middleware";
import { checkRateLimit } from "@/lib/redis/rate-limiter";
import { redis, withCacheFallback } from "@/lib/redis";
import { contactSchema, type ContactInput } from "@/lib/validation/schemas";
import { sanitizeObject } from "@/lib/validation/sanitizer";
import { db, withRetry } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import {
  fireTeamNotification,
  fireSubmitterConfirmation,
} from "@/lib/email";
import { RateLimitError, ValidationError, DatabaseError } from "@/lib/errors";
import { ERROR_CODES, FORM_TYPES } from "@/types/api";
import type { ErrorResponse, SuccessResponse } from "@/types/api";
import {
  logSuccess,
  logValidationFailed,
  logPersistenceFailed,
} from "@/lib/logger";
import { logValidationFailure } from "@/lib/security-logger";
import { WebhookService } from "@/lib/webhook";

// ─── 常量 ─────────────────────────────────────────────────────────────────────

/** Per-email 限流配置 */
const EMAIL_RATE_LIMIT = {
  /** 窗口内最大提交次数 */
  maxRequests: 5,
  /** 滑动窗口大小（秒） */
  windowSeconds: 600, // 10 分钟
} as const;

// ─── 中间件管道 ─────────────────────────────────────────────────────────────────

const middlewarePipeline = createFormMiddlewarePipeline();

// ─── Per-email 限流 ──────────────────────────────────────────────────────────────

/**
 * 检查特定邮箱是否超出提交频率限制
 * 使用 Redis Sorted Set，窗口 600 秒，最大 5 次
 *
 * @param email - 提交者邮箱
 * @returns null 表示未超限，number 表示需等待的秒数
 */
async function checkEmailRateLimit(email: string): Promise<number | null> {
  return withCacheFallback(
    () => performEmailRateLimitCheck(email),
    null, // Redis 不可用时放行
  );
}

/**
 * 执行实际的 per-email 滑动窗口限流检查
 */
async function performEmailRateLimitCheck(
  email: string,
): Promise<number | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `rate_limit:contact_email:${normalizedEmail}`;
  const now = Date.now();
  const windowMs = EMAIL_RATE_LIMIT.windowSeconds * 1000;
  const windowStart = now - windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart); // 移除窗口外的过期记录
  pipeline.zadd(key, now.toString(), `${now}-${Math.random()}`); // 添加当前请求
  pipeline.zcard(key); // 统计窗口内请求数
  pipeline.expire(key, EMAIL_RATE_LIMIT.windowSeconds + 1); // 设置 key 自动过期

  const results = await pipeline.exec();

  if (!results) {
    return null; // pipeline 执行失败，放行
  }

  const zcardResult = results[2];
  if (zcardResult && zcardResult[0]) {
    return null; // zcard 命令出错，放行
  }

  const count = zcardResult?.[1] as number;

  if (count > EMAIL_RATE_LIMIT.maxRequests) {
    // 超出限制，计算需要等待的秒数
    const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");

    if (oldest.length >= 2) {
      const oldestTime = Number(oldest[1]);
      const retryAfterMs = oldestTime + windowMs - now;
      const retryAfter = Math.ceil(retryAfterMs / 1000);
      return Math.max(retryAfter, 1);
    }

    return EMAIL_RATE_LIMIT.windowSeconds;
  }

  return null; // 未超限，放行
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 初始化请求上下文
  const context: RequestContext = {
    requestId: "",
    clientIp: "",
    locale: "zh",
  };

  // 1. 执行标准中间件管道（Request ID, Client IP, CORS, Method, Content-Type）
  const middlewareResponse = await middlewarePipeline(request, context);
  if (middlewareResponse) {
    return middlewareResponse;
  }

  const { requestId, clientIp } = context;
  const formType = "contact"; // 用于 IP 维度限流 key

  try {
    // 2. IP 维度限流检查
    const ipRetryAfter = await checkRateLimit(clientIp, formType, requestId);
    if (ipRetryAfter !== null) {
      logValidationFailed(requestId, formType, "ip_rate_limit_exceeded", {
        clientIp,
        retryAfter: ipRetryAfter,
      });
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/contact",
        method: "POST",
        rule: "rate_limit_exceeded",
        timestamp: new Date().toISOString(),
      });
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: "请求过于频繁，请稍后再试",
        },
      };
      return addCorsHeaders(
        NextResponse.json(body, {
          status: 429,
          headers: { "Retry-After": String(ipRetryAfter) },
        }),
      );
    }

    // 3. 解析 JSON body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      logValidationFailed(requestId, formType, "json_parse_failed", { clientIp });
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/contact",
        method: "POST",
        rule: "json_parse_failed",
        timestamp: new Date().toISOString(),
      });
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "请求体 JSON 格式无效",
        },
      };
      return addCorsHeaders(NextResponse.json(body, { status: 400 }));
    }

    // 4. Zod schema 验证（discriminatedUnion on form_type）
    const parseResult = contactSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const fieldPath = issue.path.join(".");
        if (fieldPath && !fieldErrors[fieldPath]) {
          fieldErrors[fieldPath] = issue.message;
        }
      }
      logValidationFailed(requestId, formType, "schema_validation_failed", {
        clientIp,
        fields: fieldErrors,
      });
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/contact",
        method: "POST",
        rule: "schema_validation_failed",
        timestamp: new Date().toISOString(),
      });
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "表单验证失败，请检查标记的字段",
          fields: fieldErrors,
        },
      };
      return addCorsHeaders(NextResponse.json(body, { status: 400 }));
    }

    const validatedData: ContactInput = parseResult.data;

    // 5. Per-email 限流检查（5 次/10 分钟）
    const emailRetryAfter = await checkEmailRateLimit(validatedData.email);
    if (emailRetryAfter !== null) {
      logValidationFailed(requestId, formType, "email_rate_limit_exceeded", {
        clientIp,
        email: validatedData.email,
        retryAfter: emailRetryAfter,
      });
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/contact",
        method: "POST",
        rule: "rate_limit_exceeded",
        timestamp: new Date().toISOString(),
      });
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: "该邮箱提交过于频繁，请稍后再试",
        },
      };
      return addCorsHeaders(
        NextResponse.json(body, {
          status: 429,
          headers: { "Retry-After": String(emailRetryAfter) },
        }),
      );
    }

    // 6. 消毒验证后数据
    const sanitizedData = sanitizeObject(
      validatedData as unknown as Record<string, unknown>,
    ) as unknown as ContactInput;

    // 7. 持久化到 contactSubmissions 表（带瞬态错误重试）
    let submissionId: string;
    try {
      const insertResult = await withRetry(async () => {
        // 构建插入数据（基于 form_type 区分字段）
        const insertData: typeof contactSubmissions.$inferInsert = {
          formType: sanitizedData.form_type,
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
        };

        if (sanitizedData.form_type === "investor") {
          insertData.company = sanitizedData.company;
          insertData.position = sanitizedData.position;
          insertData.fundTypes = sanitizedData.fund_types;
          insertData.regions = sanitizedData.regions;
          insertData.investmentSize = sanitizedData.investment_size;
        } else {
          // general
          insertData.message = sanitizedData.message;
          insertData.subject = sanitizedData.subject;
        }

        return db
          .insert(contactSubmissions)
          .values(insertData)
          .returning({ id: contactSubmissions.id });
      }, requestId);

      submissionId = insertResult[0].id;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown persistence error";
      logPersistenceFailed(requestId, formType, "database_insert_failed", {
        error: errorMsg,
      });

      // 数据库不可用返回 503，其他返回 500
      const statusCode = error instanceof DatabaseError ? error.statusCode : 500;
      const errorCode =
        statusCode === 503
          ? ERROR_CODES.SERVICE_UNAVAILABLE
          : ERROR_CODES.INTERNAL_ERROR;
      const body: ErrorResponse = {
        success: false,
        error: {
          code: errorCode,
          message: "服务暂时不可用，请稍后重试",
        },
      };
      return addCorsHeaders(NextResponse.json(body, { status: statusCode }));
    }

    // 8. 异步触发团队通知邮件（基于 form_type 路由）
    const notificationFormType =
      sanitizedData.form_type === "investor"
        ? FORM_TYPES.CONTACT_INVESTOR
        : FORM_TYPES.CONTACT_GENERAL;

    fireTeamNotification(
      {
        formType: notificationFormType as "contact-investor" | "contact-general",
        formData: sanitizedData as unknown as Record<string, unknown>,
      },
      requestId,
    );

    // 9. 异步触发提交者确认邮件
    fireSubmitterConfirmation(
      {
        email: sanitizedData.email,
        formType: notificationFormType,
        locale: context.locale,
      },
      requestId,
    );

    // 10. 异步触发 Webhook 即时通知（fire-and-forget）
    WebhookService.sendNotificationAsync({
      formType: notificationFormType,
      name: sanitizedData.name,
      email: sanitizedData.email,
      timestamp: new Date().toISOString(),
      summary: {
        subType: sanitizedData.form_type,
      },
    });

    // 11. 返回成功响应
    logSuccess(requestId, formType, "contact_submission_success", {
      submissionId,
      formSubType: sanitizedData.form_type,
    });

    const successBody: SuccessResponse<{ id: string }> = {
      success: true,
      data: { id: submissionId },
    };
    return addCorsHeaders(NextResponse.json(successBody, { status: 200 }));
  } catch (error) {
    // 兜底错误处理：不暴露内部信息
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    logPersistenceFailed(requestId, formType, "unexpected_error", {
      error: errorMsg,
    });
    const body: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "服务暂时不可用，请稍后重试",
      },
    };
    return addCorsHeaders(NextResponse.json(body, { status: 500 }));
  }
}

// ─── 非 POST 方法 → 405 ──────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PATCH(): Promise<NextResponse> {
  return methodNotAllowed();
}

/** 返回 405 Method Not Allowed 响应 */
function methodNotAllowed(): NextResponse {
  const body: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.METHOD_NOT_ALLOWED,
      message: "不允许的请求方法，请使用: POST",
    },
  };
  return NextResponse.json(body, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
