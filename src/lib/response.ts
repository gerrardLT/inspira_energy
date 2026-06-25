/**
 * 统一响应辅助函数
 * 强制所有 API 端点返回标准化的 JSON 响应结构：
 * - 成功: { success: true, data? }
 * - 失败: { success: false, error: { code, message, fields? } }
 *
 * 500/503 错误使用固定消息，不暴露任何内部信息（堆栈、路径、表名、服务标识）
 */

import { NextResponse } from "next/server";
import { ERROR_CODES } from "@/types/api";
import type { SuccessResponse, ErrorResponse } from "@/types/api";

// ─── 固定错误消息（不暴露内部信息） ──────────────────────────────────────────────

/** 500 Internal Server Error 固定消息 */
const INTERNAL_ERROR_MESSAGE = "服务器内部错误，请稍后重试";

/** 503 Service Unavailable 固定消息 */
const SERVICE_UNAVAILABLE_MESSAGE = "服务暂时不可用，请稍后重试";

// ─── 响应辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 创建标准成功响应
 *
 * @param data - 可选的响应数据负载
 * @param status - HTTP 状态码，默认 200
 * @returns NextResponse 实例，body 为 { success: true, data? }
 */
export function createSuccessResponse<T = Record<string, unknown>>(
  data?: T,
  status: number = 200
): NextResponse {
  const body: SuccessResponse<T> = { success: true };
  if (data !== undefined) {
    body.data = data;
  }
  return NextResponse.json(body, { status });
}

/**
 * 创建标准错误响应
 *
 * @param code - 机器可读的错误分类码（如 VALIDATION_ERROR）
 * @param message - 人类可读的错误描述（≤256 字符，超出将被截断）
 * @param status - HTTP 状态码
 * @param fields - 可选的字段级错误映射（仅用于验证错误）
 * @param headers - 可选的附加响应头（如 Retry-After、Allow）
 * @returns NextResponse 实例，body 为 { success: false, error: { code, message, fields? } }
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
  headers?: Record<string, string>
): NextResponse {
  // 确保 message 不超过 256 字符
  const truncatedMessage =
    message.length > 256 ? message.slice(0, 253) + "..." : message;

  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message: truncatedMessage,
    },
  };

  if (fields !== undefined && Object.keys(fields).length > 0) {
    body.error.fields = fields;
  }

  return NextResponse.json(body, {
    status,
    headers: headers ?? undefined,
  });
}

/**
 * 创建固定 500 内部错误响应
 * 消息固定，不暴露任何内部信息（堆栈追踪、文件路径、表名、第三方服务标识）
 *
 * @returns NextResponse 实例，body 为 { success: false, error: { code: "INTERNAL_ERROR", message: "..." } }
 */
export function createInternalErrorResponse(): NextResponse {
  const body: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: INTERNAL_ERROR_MESSAGE,
    },
  };
  return NextResponse.json(body, { status: 500 });
}

/**
 * 创建固定 503 服务不可用响应
 * 用于数据库连接失败等基础设施不可用场景
 * 消息固定，不暴露任何内部信息
 *
 * @returns NextResponse 实例，body 为 { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "..." } }
 */
export function createServiceUnavailableResponse(): NextResponse {
  const body: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      message: SERVICE_UNAVAILABLE_MESSAGE,
    },
  };
  return NextResponse.json(body, { status: 503 });
}
