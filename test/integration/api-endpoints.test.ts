/**
 * API Endpoints Integration Tests
 *
 * 测试完整的请求流程：验证 → 持久化 → 响应
 * 覆盖所有表单类型的正常和异常流程
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1, 8.2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── 状态追踪 ────────────────────────────────────────────────────────────────────

/** 模拟数据库存储 */
let dbStore: Map<string, Record<string, unknown>>;
/** 限流计数器：key → 当前窗口内请求数 */
let rateLimitCounts: Map<string, number>;
/** Newsletter 邮箱集合（模拟唯一约束） */
let newsletterEmails: Set<string>;
/** Newsletter 订阅记录（token → status） */
let newsletterSubscriptions: Map<string, { email: string; status: string }>;

// ─── Mock 模块 ────────────────────────────────────────────────────────────────────

// Mock Redis 限流
vi.mock("@/lib/redis/rate-limiter", () => ({
  checkRateLimit: vi.fn(),
}));

// Mock Redis 缓存
vi.mock("@/lib/redis/cache", () => ({
  getCachedEmailStatus: vi.fn().mockResolvedValue(null),
  setCachedEmailStatus: vi.fn().mockResolvedValue(undefined),
}));

// Mock Redis 连接
vi.mock("@/lib/redis", () => ({
  redis: {
    pipeline: () => ({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 0], [null, 1], [null, 1], [null, 1],
      ]),
    }),
    zrange: vi.fn().mockResolvedValue([]),
  },
  withCacheFallback: vi.fn(
    (operation: () => Promise<unknown>) => operation()
  ),
}));

// Mock 中间件 - 不执行 CORS/ContentType 检查，仅设置上下文
vi.mock("@/lib/middleware", () => ({
  createFormMiddlewarePipeline: vi.fn(() => {
    return async (
      _request: unknown,
      context: { requestId: string; clientIp: string },
    ) => {
      context.requestId = "int-test-request-id";
      context.clientIp = "192.168.1.100";
      return null;
    };
  }),
  composeMiddleware: vi.fn((..._handlers: unknown[]) => {
    return async (
      _request: unknown,
      context: { requestId: string; clientIp: string },
    ) => {
      context.requestId = "int-test-request-id";
      context.clientIp = "192.168.1.100";
      return null;
    };
  }),
  requestIdMiddleware: vi.fn(() => vi.fn()),
  clientIpMiddleware: vi.fn(() => vi.fn()),
  corsMiddleware: vi.fn(() => vi.fn()),
  contentTypeMiddleware: vi.fn(() => vi.fn()),
  methodEnforcementMiddleware: vi.fn(() => vi.fn()),
  addCorsHeaders: vi.fn((response: unknown) => response),
  extractClientIp: vi.fn(() => "192.168.1.100"),
}));

// Mock 邮件模块
vi.mock("@/lib/email", () => ({
  fireTeamNotification: vi.fn(),
  fireSubmitterConfirmation: vi.fn(),
  fireWelcomeEmail: vi.fn(),
}));

// Mock 日志模块
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logSuccess: vi.fn(),
  logValidationFailed: vi.fn(),
  logPersistenceFailed: vi.fn(),
  logEmailFailed: vi.fn(),
  generateRequestId: vi.fn(() => "int-test-request-id"),
}));

// Mock 消毒模块
vi.mock("@/lib/validation/sanitizer", () => ({
  sanitizeInput: vi.fn((input: string) => input),
  sanitizeObject: vi.fn(
    (obj: Record<string, unknown>) => ({ ...obj }),
  ),
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({ type: "eq" })),
}));

// Mock DB 模块
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [
          { id: "mock-uuid-001", unsubscribeToken: "mock-unsub-token" },
        ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
  withRetry: vi.fn((operation: () => Promise<unknown>) => operation()),
  pool: { end: vi.fn() },
}));

// Mock DB schema
vi.mock("@/lib/db/schema", () => ({
  lpInterestSubmissions: { id: "id" },
  developerSubmissions: { id: "id" },
  contactSubmissions: { id: "id" },
  newsletterSubscriptions: {
    id: "id",
    email: "email",
    unsubscribeToken: "unsubscribe_token",
  },
}));

// Mock 文件上传模块
vi.mock("@/lib/upload", () => ({
  FileStorageService: {
    validateAndStore: vi.fn(),
  },
}));

// Mock errors 模块
vi.mock("@/lib/errors", () => {
  class AppError extends Error {
    code: string;
    statusCode: number;
    fields?: Record<string, string>;
    constructor(
      message: string,
      code: string,
      statusCode: number,
      fields?: Record<string, string>,
    ) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
      this.fields = fields;
    }
  }
  class RateLimitError extends AppError {
    retryAfter: number;
    constructor(retryAfter: number) {
      super("请求过于频繁，请稍后再试", "RATE_LIMITED", 429);
      this.retryAfter = retryAfter;
    }
  }
  class ValidationError extends AppError {
    constructor(message: string, fields?: Record<string, string>) {
      super(message, "VALIDATION_ERROR", 400, fields);
    }
  }
  class DatabaseError extends AppError {
    constructor(message: string, statusCode: number = 500) {
      const code = statusCode === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR";
      super(message, code, statusCode);
    }
  }
  class FileStorageError extends AppError {
    constructor(message: string, code: string, statusCode: number) {
      super(message, code, statusCode);
    }
    static invalidType(allowedTypes: readonly string[]) {
      return new FileStorageError(
        `不支持的文件类型，允许的类型: ${allowedTypes.join(", ")}`,
        "INVALID_FILE_TYPE",
        400,
      );
    }
    static tooLarge(maxSizeMB: number) {
      return new FileStorageError(
        `文件大小超出限制，最大允许 ${maxSizeMB}MB`,
        "FILE_TOO_LARGE",
        413,
      );
    }
    static tooManyFiles(maxCount: number) {
      return new FileStorageError(
        `文件数量超出限制，最多允许 ${maxCount} 个文件`,
        "TOO_MANY_FILES",
        400,
      );
    }
    static storageFailure(detail: string) {
      return new FileStorageError(detail, "INTERNAL_ERROR", 500);
    }
  }
  return {
    AppError,
    RateLimitError,
    ValidationError,
    DatabaseError,
    FileStorageError,
    UnsupportedMediaTypeError: class extends AppError {
      constructor() {
        super("不支持的 Content-Type", "UNSUPPORTED_MEDIA_TYPE", 415);
      }
    },
    MethodNotAllowedError: class extends AppError {
      allowedMethods: string[];
      constructor(methods: string[] = ["POST"]) {
        super(`不允许的请求方法`, "METHOD_NOT_ALLOWED", 405);
        this.allowedMethods = methods;
      }
    },
  };
});

// Mock types/api 常量
vi.mock("@/types/api", () => ({
  ERROR_CODES: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
    TOO_MANY_FILES: "TOO_MANY_FILES",
    FILE_TOO_LARGE: "FILE_TOO_LARGE",
    UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
    RATE_LIMITED: "RATE_LIMITED",
    METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    INTERNAL_ERROR: "INTERNAL_ERROR",
  },
  FORM_TYPES: {
    LP_INTEREST: "lp-interest",
    DEVELOPER: "developer",
    CONTACT_INVESTOR: "contact-investor",
    CONTACT_GENERAL: "contact-general",
    NEWSLETTER: "newsletter",
  },
  FILE_CONSTRAINTS: {
    maxSize: 10 * 1024 * 1024,
    maxCount: 5,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
    ],
    allowedExtensions: [
      ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png",
    ],
  },
  RATE_LIMIT_CONFIG: { maxRequests: 5, windowSeconds: 60 },
  FIELD_LENGTH_LIMITS: {
    singleLine: 1000, multiLine: 5000, email: 254, name: 100,
    institution: 200, company: 200, position: 100, phone: 20,
    investmentSize: 50, message: 5000,
  },
}));

// Mock 验证 schemas - 使用简单逻辑模拟 Zod 验证
vi.mock("@/lib/validation/schemas", () => {
  const createSafeParse = (
    requiredFields: string[],
    emailField = "email",
  ) => {
    return (data: Record<string, unknown>) => {
      const issues: Array<{ path: string[]; message: string }> = [];
      for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === "string" && data[field] === "")) {
          issues.push({ path: [field], message: `${field}为必填项` });
        }
      }
      if (data[emailField] && typeof data[emailField] === "string") {
        const email = data[emailField] as string;
        if (!email.includes("@") || email.length > 254) {
          issues.push({ path: [emailField], message: "邮箱格式不正确" });
        }
      }
      if (issues.length > 0) {
        return { success: false, error: { issues } };
      }
      return { success: true, data };
    };
  };

  return {
    lpInterestSchema: {
      safeParse: createSafeParse(["name", "institution", "email", "fund_types"]),
    },
    developerSchema: {
      safeParse: createSafeParse([
        "company_name", "contact_name", "email", "region",
        "project_type", "capacity_mw",
      ]),
    },
    contactSchema: {
      safeParse: (data: Record<string, unknown>) => {
        const issues: Array<{ path: string[]; message: string }> = [];
        if (!data.form_type) {
          issues.push({ path: ["form_type"], message: "表单类型为必填项" });
        }
        if (!data.name) {
          issues.push({ path: ["name"], message: "姓名为必填项" });
        }
        if (!data.email || !(data.email as string).includes("@")) {
          issues.push({ path: ["email"], message: "邮箱格式不正确" });
        }
        if (data.form_type === "investor" && !data.company) {
          issues.push({ path: ["company"], message: "公司名称为必填项" });
        }
        if (data.form_type === "general" && !data.message) {
          issues.push({ path: ["message"], message: "消息内容为必填项" });
        }
        if (issues.length > 0) {
          return { success: false, error: { issues } };
        }
        return { success: true, data };
      },
    },
    newsletterSchema: {
      safeParse: (data: { email?: string }) => {
        if (
          data.email &&
          typeof data.email === "string" &&
          data.email.includes("@") &&
          data.email.length <= 254
        ) {
          return { success: true, data: { email: data.email } };
        }
        return {
          success: false,
          error: {
            issues: [{ path: ["email"], message: "邮箱格式不正确" }],
          },
        };
      },
    },
  };
});

// ─── 导入被测模块 ────────────────────────────────────────────────────────────────

import { POST as lpInterestPOST, GET as lpInterestGET } from "@/app/api/forms/lp-interest/route";
import { POST as developerPOST } from "@/app/api/forms/developer/route";
import { POST as contactPOST } from "@/app/api/forms/contact/route";
import { POST as newsletterPOST, GET as newsletterGET } from "@/app/api/forms/newsletter/route";
import { GET as unsubscribeGET } from "@/app/api/newsletter/unsubscribe/route";
import { checkRateLimit } from "@/lib/redis/rate-limiter";
import { FileStorageService } from "@/lib/upload";

const mockedCheckRateLimit = vi.mocked(checkRateLimit);
const mockedFileStorage = vi.mocked(FileStorageService.validateAndStore);

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/** 创建 JSON POST 请求 */
function createJsonRequest(
  url: string,
  body: Record<string, unknown>,
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** 创建 FormData POST 请求 */
function createFormDataRequest(
  url: string,
  fields: Record<string, string>,
  files?: File[],
): NextRequest {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  if (files) {
    for (const file of files) {
      formData.append("files", file);
    }
  }
  return new NextRequest(url, {
    method: "POST",
    body: formData,
  });
}

/** 创建 GET 请求 */
function createGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

// ─── 测试开始 ────────────────────────────────────────────────────────────────────

describe("Integration: API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbStore = new Map();
    rateLimitCounts = new Map();
    newsletterEmails = new Set();
    newsletterSubscriptions = new Map();
    mockedCheckRateLimit.mockResolvedValue(null);
    mockedFileStorage.mockResolvedValue([]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. LP Interest Form Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe("LP Interest Form - /api/forms/lp-interest", () => {
    const validLPData = {
      name: "张三",
      institution: "星辰投资有限公司",
      email: "zhangsan@example.com",
      fund_types: ["solar", "wind"],
      position: "投资总监",
      phone: "13800138000",
      regions: ["east_china"],
      investment_size: "1000万-5000万",
    };

    it("valid submission → 200 success response", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/lp-interest",
        validLPData,
      );
      const response = await lpInterestPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("invalid email → 400 with field error", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/lp-interest",
        { ...validLPData, email: "invalid-email" },
      );
      const response = await lpInterestPOST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.fields).toBeDefined();
      expect(body.error.fields.email).toBeDefined();
    });

    it("missing required fields → 400 with field errors", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/lp-interest",
        { email: "test@example.com" },
      );
      const response = await lpInterestPOST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.fields).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Developer Form Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Developer Form - /api/forms/developer", () => {
    const validDevFields = {
      company_name: "绿能科技有限公司",
      contact_name: "李四",
      email: "lisi@greentech.com",
      region: "east_china",
      project_type: "solar",
      capacity_mw: "50.5",
    };

    it("valid submission with files → 200 success", async () => {
      const file = new File(
        [new ArrayBuffer(1024)],
        "report.pdf",
        { type: "application/pdf" },
      );
      mockedFileStorage.mockResolvedValue([
        {
          originalName: "report.pdf",
          storedName: "uuid-123.pdf",
          path: "/uploads/uuid-123.pdf",
          size: 1024,
          mimeType: "application/pdf",
        },
      ]);

      const request = createFormDataRequest(
        "http://localhost/api/forms/developer",
        validDevFields,
        [file],
      );
      const response = await developerPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("file too large → 413 error", async () => {
      const { FileStorageError } = await import("@/lib/errors");
      mockedFileStorage.mockRejectedValue(
        (FileStorageError as unknown as { tooLarge: (n: number) => Error }).tooLarge(10),
      );

      const largeFile = new File(
        [new ArrayBuffer(100)],
        "huge.pdf",
        { type: "application/pdf" },
      );
      const request = createFormDataRequest(
        "http://localhost/api/forms/developer",
        validDevFields,
        [largeFile],
      );
      const response = await developerPOST(request);
      const body = await response.json();

      expect(response.status).toBe(413);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FILE_TOO_LARGE");
    });

    it("invalid file type → 400 error", async () => {
      const { FileStorageError } = await import("@/lib/errors");
      mockedFileStorage.mockRejectedValue(
        (FileStorageError as unknown as { invalidType: (t: string[]) => Error }).invalidType([".pdf", ".doc"]),
      );

      const badFile = new File(
        [new ArrayBuffer(100)],
        "script.exe",
        { type: "application/x-executable" },
      );
      const request = createFormDataRequest(
        "http://localhost/api/forms/developer",
        validDevFields,
        [badFile],
      );
      const response = await developerPOST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_FILE_TYPE");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Contact Form Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Contact Form - /api/forms/contact", () => {
    it("investor mode → 200 success", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/contact",
        {
          form_type: "investor",
          name: "王五",
          company: "盛世资本",
          email: "wangwu@capital.com",
        },
      );
      const response = await contactPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("general mode → 200 success", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/contact",
        {
          form_type: "general",
          name: "赵六",
          email: "zhaoliu@example.com",
          message: "我想了解更多关于新能源投资的信息",
        },
      );
      const response = await contactPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("general mode missing message → 400", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/contact",
        {
          form_type: "general",
          name: "赵六",
          email: "zhaoliu@example.com",
        },
      );
      const response = await contactPOST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.fields?.message).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Newsletter Subscribe/Unsubscribe Flow
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Newsletter - /api/forms/newsletter", () => {
    it("new email subscription → 200 success", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/newsletter",
        { email: "subscriber@example.com" },
      );
      const response = await newsletterPOST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("existing email (idempotent) → 200 success", async () => {
      // 第一次提交
      const request1 = createJsonRequest(
        "http://localhost/api/forms/newsletter",
        { email: "existing@example.com" },
      );
      const response1 = await newsletterPOST(request1);
      expect((await response1.json()).success).toBe(true);

      // 第二次提交同一邮箱 - 仍然返回 200
      const request2 = createJsonRequest(
        "http://localhost/api/forms/newsletter",
        { email: "existing@example.com" },
      );
      const response2 = await newsletterPOST(request2);
      const body2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(body2.success).toBe(true);
    });

    it("invalid email → 400 with validation error", async () => {
      const request = createJsonRequest(
        "http://localhost/api/forms/newsletter",
        { email: "not-an-email" },
      );
      const response = await newsletterPOST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Newsletter Unsubscribe
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Newsletter Unsubscribe - /api/newsletter/unsubscribe", () => {
    it("valid token → 200 success", async () => {
      // Mock: DB 查询返回匹配的订阅记录
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "sub-uuid",
              email: "user@example.com",
              status: "active",
              unsubscribeToken: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const request = createGetRequest(
        "http://localhost/api/newsletter/unsubscribe?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      );
      const response = await unsubscribeGET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("invalid token format → 400 error", async () => {
      const request = createGetRequest(
        "http://localhost/api/newsletter/unsubscribe?token=not-a-valid-uuid",
      );
      const response = await unsubscribeGET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it("non-existent token → 404 error", async () => {
      // Mock: DB 查询返回空
      const { db } = await import("@/lib/db");
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const request = createGetRequest(
        "http://localhost/api/newsletter/unsubscribe?token=00000000-0000-0000-0000-000000000000",
      );
      const response = await unsubscribeGET(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Rate Limiting
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Rate Limiting", () => {
    it("6th request within window → 429 with Retry-After header", async () => {
      // 模拟限流触发：第 6 次请求被限制
      mockedCheckRateLimit.mockResolvedValue(45);

      const request = createJsonRequest(
        "http://localhost/api/forms/lp-interest",
        {
          name: "测试用户",
          institution: "测试机构",
          email: "test@example.com",
          fund_types: ["solar"],
        },
      );
      const response = await lpInterestPOST(request);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RATE_LIMITED");
      expect(response.headers.get("Retry-After")).toBe("45");
    });

    it("rate limit applies to newsletter endpoint", async () => {
      mockedCheckRateLimit.mockResolvedValue(30);

      const request = createJsonRequest(
        "http://localhost/api/forms/newsletter",
        { email: "test@example.com" },
      );
      const response = await newsletterPOST(request);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RATE_LIMITED");
      expect(response.headers.get("Retry-After")).toBe("30");
    });

    it("rate limit applies to contact endpoint", async () => {
      mockedCheckRateLimit.mockResolvedValue(20);

      const request = createJsonRequest(
        "http://localhost/api/forms/contact",
        {
          form_type: "general",
          name: "测试",
          email: "test@example.com",
          message: "测试消息",
        },
      );
      const response = await contactPOST(request);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.success).toBe(false);
      expect(response.headers.get("Retry-After")).toBe("20");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Method Enforcement
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Method Enforcement", () => {
    it("GET on LP Interest POST endpoint → 405", async () => {
      const response = await lpInterestGET();
      const body = await response.json();

      expect(response.status).toBe(405);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
      expect(response.headers.get("Allow")).toBe("POST");
    });

    it("GET on Newsletter POST endpoint → 405", async () => {
      const response = await newsletterGET();
      const body = await response.json();

      expect(response.status).toBe(405);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
    });
  });
});
