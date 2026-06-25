/**
 * 文件下载 API Route Handler
 *
 * 端点：GET /api/admin/files/:fileId
 * 认证：需要有效 API Key（X-API-Key 请求头）
 *
 * 功能：
 * - 通过管理中间件管道验证 API Key
 * - 调用 DownloadService 获取文件流和元数据
 * - 返回二进制流 + Content-Type / Content-Disposition / Content-Length 响应头
 *
 * 错误处理：
 * - 认证失败 → 401（中间件短路）
 * - 文件不存在 → 404 JSON 响应
 * - 存储 I/O 错误 → 500 JSON 响应（不暴露内部路径）
 *
 * Requirements: 1.1, 1.2
 */

import { NextRequest, NextResponse } from "next/server";

import { createAdminMiddlewarePipeline } from "@/lib/admin/auth-guard";
import {
  DownloadService,
  FileNotFoundError,
  FileIOError,
} from "@/lib/admin/download-service";
import { generateRequestId } from "@/lib/logger";
import { extractClientIp, type RequestContext } from "@/lib/middleware";
import { ERROR_CODES } from "@/types/api";
import type { ErrorResponse } from "@/types/api";

// ─── 中间件管道 ──────────────────────────────────────────────────────────────────

const adminPipeline = createAdminMiddlewarePipeline();

// ─── GET Handler ─────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
): Promise<NextResponse | Response> {
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

  // 2. 提取 fileId 路由参数
  const { fileId } = await params;

  // 3. 调用 DownloadService 获取文件
  try {
    const result = await DownloadService.getFile(fileId);

    // 4. 构建响应头
    const headers = new Headers();
    headers.set("Content-Type", result.mimeType);
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${result.filename}`
    );
    if (result.size) {
      headers.set("Content-Length", String(result.size));
    }
    headers.set("X-Request-Id", context.requestId);

    // 5. 返回二进制流响应
    return new Response(result.stream, {
      status: 200,
      headers,
    });
  } catch (error) {
    // FileNotFoundError → 404
    if (error instanceof FileNotFoundError) {
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: "File not found",
        },
      };
      return NextResponse.json(body, { status: 404 });
    }

    // FileIOError → 500
    if (error instanceof FileIOError) {
      const body: ErrorResponse = {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: "An error occurred while retrieving the file",
        },
      };
      return NextResponse.json(body, { status: 500 });
    }

    // 未知错误 → 500（不暴露内部细节）
    const body: ErrorResponse = {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "An error occurred while retrieving the file",
      },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
