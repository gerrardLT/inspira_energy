/**
 * 开发商路条提交表单 API Route Handler
 *
 * 处理 multipart/form-data 请求，支持文件上传。
 * 执行流程：
 * 1. 中间件管道：请求ID → 客户端IP → CORS → 方法检查（跳过 Content-Type，因 multipart 特殊处理）
 * 2. 解析 FormData
 * 3. 文本字段验证（developerSchema）
 * 4. 文件验证与存储（FileStorageService）
 * 5. 输入消毒（sanitizeObject）
 * 6. 频率限制检查
 * 7. 数据库持久化（withRetry）
 * 8. 异步邮件通知
 * 9. 返回成功响应
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11
 */

import { NextRequest, NextResponse } from "next/server";

import { db, withRetry } from "@/lib/db";
import { developerSubmissions } from "@/lib/db/schema";
import {
  fireTeamNotification,
  fireSubmitterConfirmation,
} from "@/lib/email";
import {
  AppError,
  DatabaseError,
  RateLimitError,
  ValidationError,
  FileStorageError,
} from "@/lib/errors";
import {
  generateRequestId,
  logSuccess,
  logValidationFailed,
  logPersistenceFailed,
} from "@/lib/logger";
import { logValidationFailure } from "@/lib/security-logger";
import { WebhookService } from "@/lib/webhook";
import {
  type RequestContext,
  composeMiddleware,
  requestIdMiddleware,
  clientIpMiddleware,
  corsMiddleware,
  methodEnforcementMiddleware,
  addCorsHeaders,
} from "@/lib/middleware";
import { checkRateLimit } from "@/lib/redis/rate-limiter";
import { FileStorageService, type StoredFile } from "@/lib/upload";
import { sanitizeObject } from "@/lib/validation/sanitizer";
import { developerSchema } from "@/lib/validation/schemas";
import { ERROR_CODES, FORM_TYPES } from "@/types/api";
import type { ErrorResponse, SuccessResponse } from "@/types/api";

// ─── 中间件管道（跳过 Content-Type 检查，multipart 由 FormData API 自行处理） ────

const middlewarePipeline = composeMiddleware(
  requestIdMiddleware(),
  clientIpMiddleware(),
  corsMiddleware(),
  methodEnforcementMiddleware(["POST"])
);

// ─── POST 处理器 ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const context: RequestContext = {
    requestId: generateRequestId(),
    clientIp: "127.0.0.1",
    locale: "zh",
  };

  // 执行中间件管道
  const middlewareResponse = await middlewarePipeline(request, context);
  if (middlewareResponse !== null) {
    return middlewareResponse;
  }

  const { requestId, clientIp } = context;
  const formType = FORM_TYPES.DEVELOPER;

  try {
    // ─── 1. 频率限制检查 ─────────────────────────────────────────────────
    const retryAfter = await checkRateLimit(clientIp, formType, requestId);
    if (retryAfter !== null) {
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/developer",
        method: "POST",
        rule: "rate_limit_exceeded",
        timestamp: new Date().toISOString(),
      });
      throw new RateLimitError(retryAfter);
    }

    // ─── 2. 解析 FormData ────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/developer",
        method: "POST",
        rule: "json_parse_failed",
        timestamp: new Date().toISOString(),
      });
      throw new ValidationError("无法解析请求数据，请使用 multipart/form-data 格式提交");
    }

    // ─── 3. 提取并验证文本字段 ───────────────────────────────────────────
    const rawFields: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        rawFields[key] = value;
      }
    }

    const validationResult = developerSchema.safeParse(rawFields);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldPath = issue.path.join(".");
        if (!fieldErrors[fieldPath]) {
          fieldErrors[fieldPath] = issue.message;
        }
      }

      logValidationFailed(requestId, formType, "form_validation_failed", {
        clientIp,
        path: "/api/forms/developer",
        method: "POST",
        fields: fieldErrors,
      });
      logValidationFailure({
        requestId,
        clientIp,
        path: "/api/forms/developer",
        method: "POST",
        rule: "schema_validation_failed",
        timestamp: new Date().toISOString(),
      });

      throw new ValidationError("表单验证失败，请检查标记的字段", fieldErrors);
    }

    const validatedData = validationResult.data;

    // ─── 4. 提取并验证文件 ───────────────────────────────────────────────
    const files: File[] = [];
    for (const [, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    let storedFiles: StoredFile[] = [];
    if (files.length > 0) {
      storedFiles = await FileStorageService.validateAndStore(files);
    }

    // ─── 5. 输入消毒 ─────────────────────────────────────────────────────
    const sanitizedData = sanitizeObject(
      validatedData as unknown as Record<string, unknown>
    ) as Record<string, unknown>;

    // ─── 6. 数据库持久化 ─────────────────────────────────────────────────
    const insertResult = await withRetry(
      () =>
        db
          .insert(developerSubmissions)
          .values({
            companyName: sanitizedData.company_name as string,
            contactName: sanitizedData.contact_name as string,
            email: sanitizedData.email as string,
            region: sanitizedData.region as string,
            projectType: sanitizedData.project_type as string,
            capacityMw: String(validatedData.capacity_mw),
            projectStage: (sanitizedData.project_stage as string) ?? null,
            expectedConstructionDate:
              (sanitizedData.expected_construction_date as string) ?? null,
            notes: (sanitizedData.notes as string) ?? null,
            filePaths: storedFiles,
          })
          .returning({ id: developerSubmissions.id }),
      requestId
    );

    const submissionId = insertResult[0]?.id;

    if (!submissionId) {
      throw new DatabaseError("数据持久化失败", 500);
    }

    // ─── 7. 异步邮件通知（fire-and-forget） ──────────────────────────────

    // 生成文件链接（使用存储后的文件名）
    const fileLinks = storedFiles.map(
      (f) => `${f.originalName} (${f.storedName})`
    );

    // 团队通知邮件（含文件链接）
    fireTeamNotification(
      {
        formType: "developer",
        formData: {
          ...sanitizedData,
          capacity_mw: validatedData.capacity_mw,
          submission_id: submissionId,
        },
        fileLinks: fileLinks.length > 0 ? fileLinks : undefined,
      },
      requestId
    );

    // 提交者确认邮件
    fireSubmitterConfirmation(
      {
        email: validatedData.email,
        formType: "developer",
        locale: context.locale,
      },
      requestId
    );

    // ─── 8. 异步触发 Webhook 即时通知 ──────────────────────────────────────
    WebhookService.sendNotificationAsync({
      formType,
      name: validatedData.contact_name,
      email: validatedData.email,
      timestamp: new Date().toISOString(),
      summary: {
        company: validatedData.company_name,
        region: validatedData.region,
        projectType: validatedData.project_type,
        capacityMw: String(validatedData.capacity_mw),
      },
    });

    // ─── 9. 成功响应 ─────────────────────────────────────────────────────
    logSuccess(requestId, formType, "developer_form_submitted", {
      submissionId,
      fileCount: storedFiles.length,
    });

    const successBody: SuccessResponse<{ submissionId: string }> = {
      success: true,
      data: { submissionId },
    };

    const response = NextResponse.json(successBody, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    return handleError(error, requestId, formType);
  }
}

// ─── OPTIONS 预检处理（由 CORS 中间件处理） ──────────────────────────────────────

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const context: RequestContext = {
    requestId: generateRequestId(),
    clientIp: "127.0.0.1",
    locale: "zh",
  };

  const middlewareResponse = await middlewarePipeline(request, context);
  if (middlewareResponse !== null) {
    return middlewareResponse;
  }

  // 不应到达此处，CORS 中间件会处理 OPTIONS
  return new NextResponse(null, { status: 204 });
}

// ─── 非 POST 方法返回 405 ──────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleMethodNotAllowed(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return handleMethodNotAllowed(request);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return handleMethodNotAllowed(request);
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return handleMethodNotAllowed(request);
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

async function handleMethodNotAllowed(
  request: NextRequest
): Promise<NextResponse> {
  const context: RequestContext = {
    requestId: generateRequestId(),
    clientIp: "127.0.0.1",
    locale: "zh",
  };

  const middlewareResponse = await middlewarePipeline(request, context);
  if (middlewareResponse !== null) {
    return middlewareResponse;
  }

  // 不应到达此处，方法强制中间件会处理
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
 * 根据错误类型返回对应的 HTTP 状态码和错误响应体
 * 500/503 使用固定消息，不暴露内部信息
 */
function handleError(
  error: unknown,
  requestId: string,
  formType: string
): NextResponse {
  // 已知的应用错误
  if (error instanceof AppError) {
    // Rate limit 错误：附加 Retry-After 头
    if (error instanceof RateLimitError) {
      const body: ErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
      const response = NextResponse.json(body, {
        status: error.statusCode,
        headers: { "Retry-After": String(error.retryAfter) },
      });
      return addCorsHeaders(response);
    }

    // 文件存储错误
    if (error instanceof FileStorageError) {
      const body: ErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
      const response = NextResponse.json(body, { status: error.statusCode });
      return addCorsHeaders(response);
    }

    // 验证错误：返回字段级别的错误信息
    if (error instanceof ValidationError) {
      const body: ErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          fields: error.fields,
        },
      };
      const response = NextResponse.json(body, { status: error.statusCode });
      return addCorsHeaders(response);
    }

    // 数据库错误：使用固定消息
    if (error instanceof DatabaseError) {
      logPersistenceFailed(requestId, formType, "database_error", {
        statusCode: error.statusCode,
      });

      const body: ErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message:
            error.statusCode === 503
              ? "服务暂时不可用，请稍后重试"
              : "服务器内部错误",
        },
      };
      const response = NextResponse.json(body, { status: error.statusCode });
      return addCorsHeaders(response);
    }

    // 其他 AppError
    const body: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        fields: error.fields,
      },
    };
    const response = NextResponse.json(body, { status: error.statusCode });
    return addCorsHeaders(response);
  }

  // 未知错误：返回 500 固定消息，不暴露内部细节
  logPersistenceFailed(requestId, formType, "unexpected_error", {
    error: error instanceof Error ? error.message : "Unknown error",
  });

  const body: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "服务器内部错误",
    },
  };
  const response = NextResponse.json(body, { status: 500 });
  return addCorsHeaders(response);
}
