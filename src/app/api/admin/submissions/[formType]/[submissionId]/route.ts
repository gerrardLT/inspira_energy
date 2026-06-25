/**
 * 提交状态更新 API Route Handler
 *
 * 端点：PATCH /api/admin/submissions/:formType/:submissionId
 * 认证：需要有效 API Key（X-API-Key 请求头）
 *
 * 功能：
 * - 通过管理中间件管道验证 API Key
 * - 验证 formType 是否在允许列表内
 * - 解析请求体并验证 status 值合法性
 * - 调用 StatusService 更新提交状态
 * - 返回更新后的记录
 *
 * 错误处理：
 * - 认证失败 → 401（中间件短路）
 * - 无效 formType → 400 VALIDATION_ERROR（列出允许值）
 * - 无效 status 值 → 400 VALIDATION_ERROR（列出允许值）
 * - 提交记录不存在 → 404 NOT_FOUND
 * - 数据库操作失败 → 500 INTERNAL_ERROR
 *
 * Requirements: 3.1, 3.4
 */

import { NextRequest, NextResponse } from "next/server";

import { createAdminMiddlewarePipeline } from "@/lib/admin/auth-guard";
import { StatusService } from "@/lib/admin/status-service";
import { AppError } from "@/lib/errors";
import { generateRequestId } from "@/lib/logger";
import { extractClientIp, type RequestContext } from "@/lib/middleware";
import { ADMIN_FORM_TYPE_LIST, ERROR_CODES } from "@/types/api";
import type { AdminFormType, ErrorResponse, SuccessResponse } from "@/types/api";

// ─── 中间件管道 ──────────────────────────────────────────────────────────────────

const adminPipeline = createAdminMiddlewarePipeline();

// ─── PATCH Handler ───────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string; submissionId: string }> }
): Promise<NextResponse> {
  const context: RequestContext = {
    requestId: generateRequestId(),
    clientIp: extractClientIp(request),
    locale: "zh",
  };

  // 1. 执行管理中间件管道（认证检查）
  const middlewareResponse = await adminPipeline(request, context);
  if (middlewareResponse !== null) {
    return middlewareResponse;
  }

  // 2. 提取路由参数
  const { formType, submissionId } = await params;

  // 3. 验证 formType 合法性
  if (!ADMIN_FORM_TYPE_LIST.includes(formType as AdminFormType)) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: `Invalid form type: "${formType}". Allowed values: ${ADMIN_FORM_TYPE_LIST.join(", ")}`,
      },
    };
    return NextResponse.json(body, { status: 400 });
  }

  // 3.1 验证 submissionId 为合法 UUID 格式
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(submissionId)) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid submission ID format: expected UUID",
      },
    };
    return NextResponse.json(body, { status: 400 });
  }

  // 4. 解析请求体
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid request body: expected valid JSON",
      },
    };
    return NextResponse.json(body, { status: 400 });
  }

  try {
    // 5. 验证 status 值合法性
    const status = StatusService.validateStatus(rawBody);

    // 6. 执行状态更新
    const result = await StatusService.updateStatus(
      formType as AdminFormType,
      submissionId,
      status
    );

    // 7. 返回成功响应
    const body: SuccessResponse<typeof result> = {
      success: true,
      data: result,
    };
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    // AppError → 根据 statusCode 返回对应响应
    if (error instanceof AppError) {
      const body: ErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields && { fields: error.fields }),
        },
      };
      return NextResponse.json(body, { status: error.statusCode });
    }

    // 未知错误 → 500（不暴露内部细节）
    const body: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "An error occurred while updating submission status",
      },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
