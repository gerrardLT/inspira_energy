/**
 * LP 投资意向表单 API Route Handler
 *
 * 端点: POST /api/forms/lp-interest
 *
 * 处理流程:
 * 1. 中间件管道（请求ID → 客户端IP → CORS → 方法检查 → Content-Type 检查）
 * 2. 滑动窗口限流检查（5 次/60 秒/IP + formType）
 * 3. JSON body 解析与 Zod schema 验证
 * 4. 输入消毒（HTML 实体编码、移除 script 标签和事件处理器）
 * 5. 数据持久化（PostgreSQL + 瞬态错误重试）
 * 6. 异步邮件通知（团队通知 + 提交者确认）
 * 7. 返回标准化 JSON 响应
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { NextRequest, NextResponse } from "next/server";

import { db, withRetry } from "@/lib/db";
import { lpInterestSubmissions } from "@/lib/db/schema";
import {
  fireTeamNotification,
  fireSubmitterConfirmation,
} from "@/lib/email";
import { WebhookService } from "@/lib/webhook";
import { AppError, DatabaseError, RateLimitError, ValidationError } from "@/lib/errors";
import {
  generateRequestId,
  logSuccess,
  logValidationFailed,
  logPersistenceFailed,
  logEmailFailed,
} from "@/lib/logger";
import { logValidationFailure } from "@/lib/security-logger";
import {
  createFormMiddlewarePipeline,
  addCorsHeaders,
  type RequestContext,
} from "@/lib/middleware";
import { checkRateLimit } from "@/lib/redis/rate-limiter";
import { lpInterestSchema } from "@/lib/validation/schemas";
import { sanitizeObject } from "@/lib/validation/sanitizer";
import { ERROR_CODES, FORM_TYPES } from "@/types/api";
import type { ErrorResponse, SuccessResponse } from "@/types/api";

// ─── 常量 ────────────────────────────────────────────────────────────────────────

const FORM_TYPE = FORM_TYPES.LP_INTEREST;

// ─── POST Handler ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 初始化请求上下文
  const context: RequestContext = {
    requestId: generateRequestId(),
    clientIp: "127.0.0.1",
    locale: "zh",
  };

  try {
    // Step 1: 执行中间件管道（请求ID → 客户端IP → CORS → 方法检查 → Content-Type）
    const middlewarePipeline = createFormMiddlewarePipeline();
    const middlewareResponse = await middlewarePipeline(request, context);
    if (middlewareResponse) {
      return middlewareResponse;
    }

    // Step 2: 滑动窗口限流检查
    const retryAfter = await checkRateLimit(context.clientIp, FORM_TYPE, context.requestId);
    if (retryAfter !== null) {
      logValidationFailure({
        requestId: context.requestId,
        clientIp: context.clientIp,
        path: "/api/forms/lp-interest",
        method: "POST",
        rule: "rate_limit_exceeded",
        timestamp: new Date().toISOString(),
      });
      throw new RateLimitError(retryAfter);
    }

    // Step 3: 解析 JSON body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      logValidationFailure({
        requestId: context.requestId,
        clientIp: context.clientIp,
        path: "/api/forms/lp-interest",
        method: "POST",
        rule: "json_parse_failed",
        timestamp: new Date().toISOString(),
      });
      throw new ValidationError("请求体不是有效的 JSON 格式", {
        body: "请求体解析失败，请确保发送有效的 JSON 数据",
      });
    }

    // Step 4: Zod schema 验证
    const parseResult = lpInterestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const fields: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const fieldPath = issue.path.join(".");
        // 仅保留第一个错误信息
        if (!fields[fieldPath]) {
          fields[fieldPath] = issue.message;
        }
      }
      logValidationFailed(context.requestId, FORM_TYPE, "表单验证失败", { fields });
      logValidationFailure({
        requestId: context.requestId,
        clientIp: context.clientIp,
        path: "/api/forms/lp-interest",
        method: "POST",
        rule: "schema_validation_failed",
        timestamp: new Date().toISOString(),
      });
      throw new ValidationError("表单验证失败，请检查标记的字段", fields);
    }

    const validatedData = parseResult.data;

    // Step 5: 输入消毒
    const sanitizedData = sanitizeObject(validatedData as unknown as Record<string, unknown>);

    // Step 6: 持久化到数据库（带瞬态错误重试）
    let insertedId: string;
    try {
      const result = await withRetry(
        () =>
          db
            .insert(lpInterestSubmissions)
            .values({
              name: sanitizedData.name as string,
              institution: sanitizedData.institution as string,
              email: sanitizedData.email as string,
              fundTypes: sanitizedData.fund_types,
              position: (sanitizedData.position as string) || null,
              phone: (sanitizedData.phone as string) || null,
              regions: sanitizedData.regions ?? [],
              investmentSize: (sanitizedData.investment_size as string) || null,
            })
            .returning({ id: lpInterestSubmissions.id }),
        context.requestId
      );
      insertedId = result[0].id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown database error";
      logPersistenceFailed(context.requestId, FORM_TYPE, "数据库持久化失败", {
        error: errorMessage,
      });

      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError("服务器内部错误", 500);
    }

    // Step 7: 异步触发邮件通知（非阻塞）
    fireTeamNotification(
      {
        formType: "lp-interest",
        formData: sanitizedData,
      },
      context.requestId,
      async () => {
        logEmailFailed(context.requestId, FORM_TYPE, "团队通知邮件发送失败（所有重试已用尽）");
      }
    );

    fireSubmitterConfirmation(
      {
        email: sanitizedData.email as string,
        formType: FORM_TYPE,
        locale: context.locale,
      },
      context.requestId,
      async () => {
        logEmailFailed(context.requestId, FORM_TYPE, "提交者确认邮件发送失败（所有重试已用尽）");
      }
    );

    // Step 8: 异步触发 Webhook 即时通知（fire-and-forget）
    WebhookService.sendNotificationAsync({
      formType: FORM_TYPE,
      name: sanitizedData.name as string,
      email: sanitizedData.email as string,
      timestamp: new Date().toISOString(),
      summary: {
        institution: (sanitizedData.institution as string) || "",
        fundTypes: Array.isArray(sanitizedData.fund_types)
          ? (sanitizedData.fund_types as string[]).join(", ")
          : "",
      },
    });

    // Step 9: 返回成功响应
    logSuccess(context.requestId, FORM_TYPE, "LP 投资意向表单提交成功", { id: insertedId });

    const successBody: SuccessResponse<{ id: string }> = {
      success: true,
      data: { id: insertedId },
    };

    const response = NextResponse.json(successBody, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    return handleError(error, context);
  }
}

// ─── 非 POST 方法处理（405 Method Not Allowed） ──────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return createMethodNotAllowedResponse();
}

export async function PUT(): Promise<NextResponse> {
  return createMethodNotAllowedResponse();
}

export async function DELETE(): Promise<NextResponse> {
  return createMethodNotAllowedResponse();
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/**
 * 创建 405 Method Not Allowed 响应
 * 包含 Allow: POST 头
 */
function createMethodNotAllowedResponse(): NextResponse {
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

/**
 * 统一错误处理
 * 根据错误类型返回对应的 HTTP 状态码和标准化错误响应
 */
function handleError(error: unknown, context: RequestContext): NextResponse {
  // 已知应用错误
  if (error instanceof AppError) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message.slice(0, 256),
        ...(error.fields && { fields: error.fields }),
      },
    };

    const headers: Record<string, string> = {};

    // RateLimitError 附带 Retry-After 头
    if (error instanceof RateLimitError) {
      headers["Retry-After"] = String(error.retryAfter);
    }

    const response = NextResponse.json(body, {
      status: error.statusCode,
      headers,
    });
    return addCorsHeaders(response);
  }

  // 未知错误：返回 500 + 固定消息（不暴露内部信息）
  logPersistenceFailed(context.requestId, FORM_TYPE, "未预期的服务器错误", {
    error: error instanceof Error ? error.message : "Unknown error",
  });

  const body: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "服务器内部错误，请稍后重试",
    },
  };

  const response = NextResponse.json(body, { status: 500 });
  return addCorsHeaders(response);
}
