/**
 * 提交查询 API Route Handler
 *
 * 端点：GET /api/admin/submissions/:formType
 * 认证：需要有效 API Key（X-API-Key 请求头）
 *
 * 功能：
 * - 通过管理中间件管道验证 API Key
 * - 验证 formType 是否在允许列表内
 * - 解析查询参数并调用 QueryService
 * - 返回分页查询结果
 *
 * 错误处理：
 * - 认证失败 → 401（中间件短路）
 * - 无效 formType → 400 VALIDATION_ERROR（列出允许值）
 * - 查询参数验证失败 → 400 VALIDATION_ERROR（字段级错误）
 * - 服务端错误 → 500 INTERNAL_ERROR
 *
 * Requirements: 2.1, 2.2, 2.9
 */

import { NextRequest, NextResponse } from "next/server";

import { createAdminMiddlewarePipeline } from "@/lib/admin/auth-guard";
import { QueryService, QueryValidationError } from "@/lib/admin/query-service";
import { generateRequestId } from "@/lib/logger";
import { extractClientIp, type RequestContext } from "@/lib/middleware";
import { ADMIN_FORM_TYPE_LIST, ERROR_CODES } from "@/types/api";
import type { AdminFormType, ErrorResponse, SuccessResponse } from "@/types/api";

// ─── 中间件管道 ──────────────────────────────────────────────────────────────────

const adminPipeline = createAdminMiddlewarePipeline();

// ─── GET Handler ─────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string }> }
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

  // 2. 提取并验证 formType 路由参数
  const { formType } = await params;

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

  // 3. 解析 URL 查询参数
  const searchParams = request.nextUrl.searchParams;
  const rawParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  try {
    // 4. 验证查询参数
    const validatedParams = QueryService.validateParams(rawParams);

    // 5. 执行查询
    const result = await QueryService.query(
      formType as AdminFormType,
      validatedParams
    );

    // 6. 返回成功响应
    const body: SuccessResponse<typeof result> = {
      success: true,
      data: result,
    };
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    // QueryValidationError → 400（字段级错误）
    if (error instanceof QueryValidationError) {
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
          fields: error.fields,
        },
      };
      return NextResponse.json(body, { status: 400 });
    }

    // 其他错误 → 500（不暴露内部细节）
    const body: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "An error occurred while querying submissions",
      },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
