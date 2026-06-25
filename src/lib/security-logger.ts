/**
 * 安全日志模块
 * 记录验证失败等安全相关事件，用于安全监控和审计
 *
 * 日志条目包含：客户端 IP、请求路径、HTTP 方法、失败的验证规则、时间戳
 */

import { logger } from "@/lib/logger";

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

/** 验证失败日志参数 */
export interface ValidationFailureParams {
  /** UUID v4 请求标识符 */
  requestId: string;
  /** 客户端 IP 地址 */
  clientIp: string;
  /** 请求路径（如 /api/forms/lp-interest） */
  path: string;
  /** HTTP 请求方法（如 POST、GET） */
  method: string;
  /** 失败的验证规则描述（如 "email_format_invalid"、"field_required:name"） */
  rule: string;
  /** ISO 8601 格式时间戳 */
  timestamp: string;
}

// ─── 安全日志函数 ────────────────────────────────────────────────────────────────

/**
 * 记录验证失败的安全事件
 * 用于安全监控，检测潜在的恶意请求模式
 *
 * @param params - 验证失败事件的详细信息
 */
export function logValidationFailure(params: ValidationFailureParams): void {
  const { requestId, clientIp, path, method, rule, timestamp } = params;

  logger.warn(
    {
      requestId,
      clientIp,
      path,
      method,
      rule,
      timestamp,
      event: "validation_failure",
      category: "security",
    },
    `Validation failure: ${rule} [${method} ${path}] from ${clientIp}`
  );
}
