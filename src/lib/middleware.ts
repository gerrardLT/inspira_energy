/**
 * 中间件组合器与通用中间件
 * 提供请求管道化处理能力，支持按顺序执行中间件并在任一中间件返回响应时短路
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRequestId } from "@/lib/logger";
import { ERROR_CODES } from "@/types/api";
import type { ErrorResponse } from "@/types/api";

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

/** 请求上下文，贯穿整个请求生命周期 */
export interface RequestContext {
  /** UUID v4 请求标识符 */
  requestId: string;
  /** 客户端真实 IP 地址 */
  clientIp: string;
  /** 页面语言（zh/en） */
  locale: string;
}

/**
 * 中间件处理函数类型
 * 返回 NextResponse 表示短路（直接返回该响应）
 * 返回 null 表示通过，继续执行下一个中间件
 */
export type MiddlewareHandler = (
  request: NextRequest,
  context: RequestContext
) => Promise<NextResponse | null>;

// ─── 核心组合函数 ─────────────────────────────────────────────────────────────────

/**
 * 组合多个中间件，按顺序执行
 * 任一中间件返回 NextResponse 则短路返回该响应
 * 所有中间件返回 null 则最终返回 null，表示请求可继续处理
 */
export function composeMiddleware(
  ...handlers: MiddlewareHandler[]
): MiddlewareHandler {
  return async (
    request: NextRequest,
    context: RequestContext
  ): Promise<NextResponse | null> => {
    for (const handler of handlers) {
      const response = await handler(request, context);
      if (response !== null) {
        return response;
      }
    }
    return null;
  };
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/** 构建标准化错误响应 */
function createErrorResponse(
  code: string,
  message: string,
  statusCode: number,
  headers?: Record<string, string>
): NextResponse {
  const body: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, {
    status: statusCode,
    headers: headers ?? undefined,
  });
}

/**
 * 从请求中提取客户端真实 IP 地址
 * 优先使用 X-Forwarded-For 头中最左侧的未信任地址
 * 回退到 X-Real-IP 头或默认值
 */
export function extractClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For 格式: client, proxy1, proxy2
    // 最左侧为原始客户端 IP（最不可信的第一个即为 leftmost untrusted）
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Next.js 可能通过 request.ip 提供 IP，但在某些环境下不可用
  // 使用默认回退值
  return "127.0.0.1";
}

// ─── 中间件实现 ──────────────────────────────────────────────────────────────────

/**
 * 请求 ID 生成中间件
 * 为每个请求生成唯一的 UUID v4 标识符，设置到上下文中
 * 始终通过（返回 null）
 */
export function requestIdMiddleware(): MiddlewareHandler {
  return async (
    _request: NextRequest,
    context: RequestContext
  ): Promise<NextResponse | null> => {
    context.requestId = generateRequestId();
    return null;
  };
}

/**
 * 客户端 IP 提取中间件
 * 从请求头中提取真实客户端 IP 地址并设置到上下文中
 * 始终通过（返回 null）
 */
export function clientIpMiddleware(): MiddlewareHandler {
  return async (
    request: NextRequest,
    context: RequestContext
  ): Promise<NextResponse | null> => {
    context.clientIp = extractClientIp(request);
    return null;
  };
}

/**
 * CORS 处理中间件
 * - 对 OPTIONS 预检请求返回 204 并附带 CORS 头
 * - 对正常请求验证 Origin 头是否匹配配置的允许源
 * - 不匹配的跨域请求返回 403
 *
 * CORS_ORIGIN 环境变量配置允许的源
 */
export function corsMiddleware(): MiddlewareHandler {
  return async (
    request: NextRequest,
    _context: RequestContext
  ): Promise<NextResponse | null> => {
    const allowedOrigin = process.env.CORS_ORIGIN ?? "";
    const requestOrigin = request.headers.get("origin");

    // OPTIONS 预检请求：返回 CORS 头 + 204
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 非跨域请求（无 Origin 头）：放行
    if (!requestOrigin) {
      return null;
    }

    // 跨域请求：验证 Origin 是否匹配
    if (requestOrigin !== allowedOrigin) {
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        "跨域请求不被允许",
        403
      );
    }

    // Origin 匹配：放行（后续由响应添加 CORS 头）
    return null;
  };
}

/**
 * Content-Type 验证中间件
 * 仅允许 application/json 和 multipart/form-data
 * 不符合时返回 415 Unsupported Media Type
 */
export function contentTypeMiddleware(): MiddlewareHandler {
  return async (
    request: NextRequest,
    _context: RequestContext
  ): Promise<NextResponse | null> => {
    // OPTIONS 预检请求不需要 Content-Type 检查
    if (request.method === "OPTIONS") {
      return null;
    }

    const contentType = request.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const isMultipart = contentType.includes("multipart/form-data");

    if (!isJson && !isMultipart) {
      return createErrorResponse(
        ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
        "不支持的 Content-Type，请使用 application/json 或 multipart/form-data",
        415
      );
    }

    return null;
  };
}

/**
 * HTTP 方法强制中间件
 * 仅允许指定的 HTTP 方法（默认为 POST）
 * 不匹配时返回 405 Method Not Allowed + Allow 头
 */
export function methodEnforcementMiddleware(
  allowedMethods: string[] = ["POST"]
): MiddlewareHandler {
  return async (
    request: NextRequest,
    _context: RequestContext
  ): Promise<NextResponse | null> => {
    // OPTIONS 由 CORS 中间件处理，此处放行
    if (request.method === "OPTIONS") {
      return null;
    }

    if (!allowedMethods.includes(request.method)) {
      return createErrorResponse(
        ERROR_CODES.METHOD_NOT_ALLOWED,
        `不允许的请求方法，请使用: ${allowedMethods.join(", ")}`,
        405,
        { Allow: allowedMethods.join(", ") }
      );
    }

    return null;
  };
}

// ─── 预构建管道 ──────────────────────────────────────────────────────────────────

/**
 * 创建标准表单提交中间件管道
 * 执行顺序: 请求ID → 客户端IP → CORS → 方法检查 → Content-Type 检查
 *
 * @returns 组合后的中间件处理函数
 */
export function createFormMiddlewarePipeline(): MiddlewareHandler {
  return composeMiddleware(
    requestIdMiddleware(),
    clientIpMiddleware(),
    corsMiddleware(),
    methodEnforcementMiddleware(["POST"]),
    contentTypeMiddleware()
  );
}

/**
 * 为响应添加 CORS 头
 * 在请求通过中间件管道后，为最终响应添加跨域头
 *
 * @param response - 待添加头的响应
 * @param methods - 允许的 HTTP 方法列表，默认 "POST, OPTIONS"
 */
export function addCorsHeaders(
  response: NextResponse,
  methods: string = "POST, GET, PATCH, OPTIONS"
): NextResponse {
  const allowedOrigin = process.env.CORS_ORIGIN ?? "";
  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Methods", methods);
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key"
  );
  return response;
}
