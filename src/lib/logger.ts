import pino from "pino";
import { v4 as uuidv4 } from "uuid";

/**
 * 结构化日志条目接口
 * 所有表单提交操作的日志记录必须遵循此结构
 */
export interface LogEntry {
  /** UUID v4 请求标识符，同一请求生命周期内保持一致 */
  requestId: string;
  /** ISO 8601 格式时间戳 */
  timestamp: string;
  /** 日志级别：info 表示成功，warn 表示降级状态，error 表示失败 */
  level: "info" | "warn" | "error";
  /** 表单类型标识 */
  formType?: string;
  /** 事件描述 */
  event: string;
  /** 处理结果 */
  result?: "success" | "validation_failed" | "persistence_failed" | "email_failed";
  /** 附加详情 */
  details?: Record<string, unknown>;
}

/**
 * pino 实例配置
 * - 输出格式：结构化 JSON
 * - 时间戳：ISO 8601 格式
 * - 级别标签：使用字符串标签而非数字
 * - 生产环境支持通过 LOG_LEVEL 环境变量调整日志级别
 * - 开发环境自动使用 pino-pretty（如果已安装）
 */
const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  formatters: {
    level(label: string) {
      return { level: label };
    },
  },
  // 生产环境建议通过 pino-socket/pino-elasticsearch 等 transport 管道采集
  // 使用方式：node server.js | pino-transport -d target.js
  // 或配置环境变量 LOG_TRANSPORT 指定 transport 目标
  ...(process.env.LOG_TRANSPORT
    ? {
        transport: {
          target: process.env.LOG_TRANSPORT,
          options: process.env.LOG_TRANSPORT_OPTIONS
            ? JSON.parse(process.env.LOG_TRANSPORT_OPTIONS)
            : {},
        },
      }
    : {}),
});

/**
 * 生成新的 UUID v4 请求 ID
 */
export function generateRequestId(): string {
  return uuidv4();
}

/**
 * 创建带有请求 ID 绑定的子 logger
 * 同一请求内所有日志条目共享相同的 requestId，实现端到端追踪
 */
export function createRequestLogger(requestId: string, formType?: string) {
  const bindings: Record<string, unknown> = { requestId };
  if (formType) {
    bindings.formType = formType;
  }
  return baseLogger.child(bindings);
}

/**
 * 记录结构化日志条目
 * 遵循 LogEntry 接口规范，确保所有字段都以结构化 JSON 输出
 */
export function logEntry(entry: LogEntry): void {
  const { level, requestId, timestamp, formType, event, result, details } = entry;
  const logData: Record<string, unknown> = {
    requestId,
    formType,
    event,
    result,
    details,
  };

  // 移除 undefined 值以保持 JSON 输出整洁
  for (const key of Object.keys(logData)) {
    if (logData[key] === undefined) {
      delete logData[key];
    }
  }

  switch (level) {
    case "info":
      baseLogger.info(logData, event);
      break;
    case "warn":
      baseLogger.warn(logData, event);
      break;
    case "error":
      baseLogger.error(logData, event);
      break;
  }
}

/**
 * 便捷方法：记录表单提交成功
 */
export function logSuccess(requestId: string, formType: string, event: string, details?: Record<string, unknown>): void {
  logEntry({
    requestId,
    timestamp: new Date().toISOString(),
    level: "info",
    formType,
    event,
    result: "success",
    details,
  });
}

/**
 * 便捷方法：记录验证失败
 */
export function logValidationFailed(requestId: string, formType: string, event: string, details?: Record<string, unknown>): void {
  logEntry({
    requestId,
    timestamp: new Date().toISOString(),
    level: "warn",
    formType,
    event,
    result: "validation_failed",
    details,
  });
}

/**
 * 便捷方法：记录持久化失败
 */
export function logPersistenceFailed(requestId: string, formType: string, event: string, details?: Record<string, unknown>): void {
  logEntry({
    requestId,
    timestamp: new Date().toISOString(),
    level: "error",
    formType,
    event,
    result: "persistence_failed",
    details,
  });
}

/**
 * 便捷方法：记录邮件发送失败
 */
export function logEmailFailed(requestId: string, formType: string, event: string, details?: Record<string, unknown>): void {
  logEntry({
    requestId,
    timestamp: new Date().toISOString(),
    level: "error",
    formType,
    event,
    result: "email_failed",
    details,
  });
}

export { baseLogger as logger };
