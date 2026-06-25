/**
 * 统一错误类型定义
 * 所有错误类继承自基础 AppError，并携带标准化的错误码和 HTTP 状态码
 */

import { ERROR_CODES, type ErrorCode } from "@/types/api";

/** 应用基础错误类 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly fields?: Record<string, string>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    fields?: Record<string, string>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.fields = fields;
  }
}

/** 输入验证错误（400） */
export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, fields);
  }
}

/** 请求频率限制错误（429） */
export class RateLimitError extends AppError {
  /** 客户端需要等待的秒数 */
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super("请求过于频繁，请稍后再试", ERROR_CODES.RATE_LIMITED, 429);
    this.retryAfter = retryAfter;
  }
}

/** 数据库操作错误（500 或 503） */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    statusCode: 500 | 503 = 500
  ) {
    const code =
      statusCode === 503
        ? ERROR_CODES.SERVICE_UNAVAILABLE
        : ERROR_CODES.INTERNAL_ERROR;
    super(message, code, statusCode);
  }
}

/** 文件存储错误（400 / 413 / 500） */
export class FileStorageError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number
  ) {
    super(message, code, statusCode);
  }

  /** 文件类型不允许 */
  static invalidType(allowedTypes: readonly string[]): FileStorageError {
    return new FileStorageError(
      `不支持的文件类型，允许的类型: ${allowedTypes.join(", ")}`,
      ERROR_CODES.INVALID_FILE_TYPE,
      400
    );
  }

  /** 文件过大 */
  static tooLarge(maxSizeMB: number): FileStorageError {
    return new FileStorageError(
      `文件大小超出限制，最大允许 ${maxSizeMB}MB`,
      ERROR_CODES.FILE_TOO_LARGE,
      413
    );
  }

  /** 文件数量超限 */
  static tooManyFiles(maxCount: number): FileStorageError {
    return new FileStorageError(
      `文件数量超出限制，最多允许 ${maxCount} 个文件`,
      ERROR_CODES.TOO_MANY_FILES,
      400
    );
  }

  /** 存储 I/O 错误 */
  static storageFailure(detail: string): FileStorageError {
    return new FileStorageError(
      detail,
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/** Content-Type 不支持错误（415） */
export class UnsupportedMediaTypeError extends AppError {
  constructor() {
    super(
      "不支持的 Content-Type，请使用 application/json 或 multipart/form-data",
      ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      415
    );
  }
}

/** HTTP 方法不允许错误（405） */
export class MethodNotAllowedError extends AppError {
  readonly allowedMethods: string[];

  constructor(allowedMethods: string[] = ["POST"]) {
    super(
      `不允许的请求方法，请使用: ${allowedMethods.join(", ")}`,
      ERROR_CODES.METHOD_NOT_ALLOWED,
      405
    );
    this.allowedMethods = allowedMethods;
  }
}
