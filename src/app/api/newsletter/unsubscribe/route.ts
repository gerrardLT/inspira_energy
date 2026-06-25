/**
 * Newsletter 退订 API Route Handler
 *
 * 端点: GET /api/newsletter/unsubscribe?token={uuid}
 *
 * 处理流程:
 * 1. 从 URL 搜索参数中提取 token
 * 2. 验证 token 为有效的 UUID v4 格式
 * 3. 查询数据库中匹配 unsubscribeToken 的订阅记录
 * 4. 更新订阅状态为 "unsubscribed"
 * 5. 返回确认响应
 *
 * 注意: 此端点为 GET 方法（用户从邮件中点击退订链接）
 *
 * Requirements: 4.7, 4.8
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db, withRetry } from "@/lib/db";
import { newsletterSubscriptions } from "@/lib/db/schema";
import { AppError, ValidationError } from "@/lib/errors";
import { generateRequestId, logSuccess, logValidationFailed } from "@/lib/logger";
import { logValidationFailure } from "@/lib/security-logger";
import {
  composeMiddleware,
  requestIdMiddleware,
  clientIpMiddleware,
  corsMiddleware,
  methodEnforcementMiddleware,
  addCorsHeaders,
  type RequestContext,
} from "@/lib/middleware";
import { ERROR_CODES } from "@/types/api";
import type { ErrorResponse, SuccessResponse } from "@/types/api";

// ─── 常量 ────────────────────────────────────────────────────────────────────────

const FORM_TYPE = "newsletter-unsubscribe";

/** UUID v4 正则表达式（标准 8-4-4-4-12 格式） */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── GET Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 初始化请求上下文
  const context: RequestContext = {
    requestId: generateRequestId(),
    clientIp: "127.0.0.1",
    locale: "zh",
  };

  try {
    // Step 1: 执行中间件管道（请求ID → 客户端IP → CORS → 方法检查允许GET）
    const middlewarePipeline = composeMiddleware(
      requestIdMiddleware(),
      clientIpMiddleware(),
      corsMiddleware(),
      methodEnforcementMiddleware(["GET"]),
    );
    const middlewareResponse = await middlewarePipeline(request, context);
    if (middlewareResponse) {
      return middlewareResponse;
    }

    // Step 2: 从 URL 参数中提取 token
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      logValidationFailed(context.requestId, FORM_TYPE, "缺少退订 token 参数");
      logValidationFailure({
        requestId: context.requestId,
        clientIp: context.clientIp,
        path: "/api/newsletter/unsubscribe",
        method: "GET",
        rule: "token_format_invalid",
        timestamp: new Date().toISOString(),
      });
      throw new ValidationError("缺少退订 token 参数", {
        token: "退订链接缺少必要的 token 参数",
      });
    }

    // Step 3: 验证 token 为有效的 UUID 格式
    if (!UUID_REGEX.test(token)) {
      logValidationFailed(context.requestId, FORM_TYPE, "token 格式无效", { token });
      logValidationFailure({
        requestId: context.requestId,
        clientIp: context.clientIp,
        path: "/api/newsletter/unsubscribe",
        method: "GET",
        rule: "token_format_invalid",
        timestamp: new Date().toISOString(),
      });
      throw new ValidationError("token 格式无效", {
        token: "退订 token 格式不正确",
      });
    }

    // Step 4: 查询数据库中匹配的订阅记录
    const subscriptions = await withRetry(
      () =>
        db
          .select()
          .from(newsletterSubscriptions)
          .where(eq(newsletterSubscriptions.unsubscribeToken, token)),
      context.requestId,
    );

    if (subscriptions.length === 0) {
      // token 不存在于数据库中
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "退订链接无效或已过期",
        },
      };
      const response = NextResponse.json(body, { status: 404 });
      return addCorsHeaders(response);
    }

    // Step 5: 更新订阅状态为 "unsubscribed"
    await withRetry(
      () =>
        db
          .update(newsletterSubscriptions)
          .set({ status: "unsubscribed" })
          .where(eq(newsletterSubscriptions.unsubscribeToken, token)),
      context.requestId,
    );

    // Step 6: 返回成功响应
    logSuccess(context.requestId, FORM_TYPE, "Newsletter 退订成功", {
      email: subscriptions[0].email,
    });

    const successBody: SuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "您已成功退订 Newsletter" },
    };

    const response = NextResponse.json(successBody, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    return handleError(error, context);
  }
}

// ─── 非 GET 方法处理（405 Method Not Allowed） ───────────────────────────────────

export async function POST(): Promise<NextResponse> {
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
 * 包含 Allow: GET 头
 */
function createMethodNotAllowedResponse(): NextResponse {
  const body: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.METHOD_NOT_ALLOWED,
      message: "不允许的请求方法，请使用: GET",
    },
  };
  return NextResponse.json(body, {
    status: 405,
    headers: { Allow: "GET" },
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

    const response = NextResponse.json(body, {
      status: error.statusCode,
    });
    return addCorsHeaders(response);
  }

  // 未知错误：返回 500 + 固定消息（不暴露内部信息）
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logValidationFailed(context.requestId, FORM_TYPE, "未预期的服务器错误", {
    error: errorMessage,
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
