/**
 * API 统一响应类型定义
 * 所有 API 端点的请求/响应类型约定
 */

// ─── 响应结构 ───────────────────────────────────────────────────────────────────

/** 统一错误响应体 */
export interface ErrorResponse {
  success: false;
  error: {
    /** 机器可读的错误分类码 */
    code: string;
    /** 人类可读的描述（≤256字符） */
    message: string;
    /** 字段级错误信息（仅验证错误时） */
    fields?: Record<string, string>;
  };
}

/** 统一成功响应体 */
export interface SuccessResponse<T = Record<string, unknown>> {
  success: true;
  data?: T;
}

/** 表单处理结果（内部服务层使用） */
export interface FormResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

/** API 响应联合类型 */
export type ApiResponse<T = Record<string, unknown>> =
  | SuccessResponse<T>
  | ErrorResponse;

// ─── 错误码常量 ─────────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  TOO_MANY_FILES: "TOO_MANY_FILES",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  RATE_LIMITED: "RATE_LIMITED",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  SERVICE_NOT_CONFIGURED: "SERVICE_NOT_CONFIGURED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─── 枚举定义 ───────────────────────────────────────────────────────────────────

/** 表单提交状态 */
export const SUBMISSION_STATUS = {
  PENDING: "pending",
  CONTACTED: "contacted",
  CLOSED: "closed",
} as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

/** Newsletter 订阅状态 */
export const NEWSLETTER_STATUS = {
  ACTIVE: "active",
  UNSUBSCRIBED: "unsubscribed",
} as const;

export type NewsletterStatus =
  (typeof NEWSLETTER_STATUS)[keyof typeof NEWSLETTER_STATUS];

/** 联系表单类型 */
export const CONTACT_FORM_TYPE = {
  INVESTOR: "investor",
  GENERAL: "general",
} as const;

export type ContactFormType =
  (typeof CONTACT_FORM_TYPE)[keyof typeof CONTACT_FORM_TYPE];

// ─── 文件上传约束 ────────────────────────────────────────────────────────────────

export const FILE_CONSTRAINTS = {
  /** 单文件最大大小（字节）：10MB */
  maxSize: 10 * 1024 * 1024,
  /** 单次提交最大文件数 */
  maxCount: 5,
  /** 允许的 MIME 类型 */
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ] as const,
  /** 允许的文件扩展名 */
  allowedExtensions: [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".jpg",
    ".jpeg",
    ".png",
  ] as const,
} as const;

export type AllowedMimeType = (typeof FILE_CONSTRAINTS.allowedMimeTypes)[number];
export type AllowedExtension = (typeof FILE_CONSTRAINTS.allowedExtensions)[number];

// ─── 限流配置 ────────────────────────────────────────────────────────────────────

export const RATE_LIMIT_CONFIG = {
  /** 窗口内最大请求数 */
  maxRequests: 5,
  /** 滑动窗口大小（秒） */
  windowSeconds: 60,
} as const;

// ─── 字段长度约束 ────────────────────────────────────────────────────────────────

export const FIELD_LENGTH_LIMITS = {
  /** 单行字段最大字符数 */
  singleLine: 1000,
  /** 多行字段最大字符数 */
  multiLine: 5000,
  /** 邮箱最大字符数 */
  email: 254,
  /** 姓名最大字符数 */
  name: 100,
  /** 机构名称最大字符数 */
  institution: 200,
  /** 公司名称最大字符数 */
  company: 200,
  /** 职位最大字符数 */
  position: 100,
  /** 电话最大字符数 */
  phone: 20,
  /** 投资规模最大字符数 */
  investmentSize: 50,
  /** 消息/备注最大字符数 */
  message: 5000,
} as const;

// ─── 表单类型标识 ────────────────────────────────────────────────────────────────

export const FORM_TYPES = {
  LP_INTEREST: "lp-interest",
  DEVELOPER: "developer",
  CONTACT_INVESTOR: "contact-investor",
  CONTACT_GENERAL: "contact-general",
  NEWSLETTER: "newsletter",
} as const;

export type FormType = (typeof FORM_TYPES)[keyof typeof FORM_TYPES];

// ─── 日志处理结果 ────────────────────────────────────────────────────────────────

export const LOG_RESULTS = {
  SUCCESS: "success",
  VALIDATION_FAILED: "validation_failed",
  PERSISTENCE_FAILED: "persistence_failed",
  EMAIL_FAILED: "email_failed",
} as const;

export type LogResult = (typeof LOG_RESULTS)[keyof typeof LOG_RESULTS];

// ─── 管理 API 类型 ──────────────────────────────────────────────────────────────

/** 管理 API 支持的表单类型 */
export const ADMIN_FORM_TYPES = {
  LP_INTEREST: "lp-interest",
  DEVELOPER: "developer",
  CONTACT: "contact",
  NEWSLETTER: "newsletter",
} as const;

export type AdminFormType =
  (typeof ADMIN_FORM_TYPES)[keyof typeof ADMIN_FORM_TYPES];

/** 管理 API 允许的表单类型列表（用于运行时验证） */
export const ADMIN_FORM_TYPE_LIST: AdminFormType[] = [
  "lp-interest",
  "developer",
  "contact",
  "newsletter",
];

// ─── 分页类型 ────────────────────────────────────────────────────────────────────

/** 分页元数据 */
export interface PaginationMeta {
  /** 匹配记录总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/** 分页结果泛型 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── 存储层类型 ──────────────────────────────────────────────────────────────────

/** 存储后端类型 */
export type StorageBackendType = "local" | "s3";

/** 存储错误分类码 */
export type StorageErrorCode =
  | "connection_error"
  | "not_found"
  | "permission_denied"
  | "storage_full";
