/**
 * Property 8: Newsletter Subscription Idempotence
 *
 * Feature: backend-infrastructure, Property 8: Newsletter Subscription Idempotence
 *
 * 对于任何有效邮箱地址，提交 Newsletter 订阅请求 N 次（N ≥ 1），
 * 数据库中应仅存在该邮箱的一条记录，且每次提交都应返回成功响应，
 * 无论该邮箱是否已订阅。
 *
 * Validates: Requirements 4.3
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

// ─── 状态追踪 ────────────────────────────────────────────────────────────────────

/** 模拟数据库中已存在的邮箱集合 */
let dbEmails: Set<string>;
/** 模拟缓存中已存在的邮箱集合 */
let cacheEmails: Set<string>;
/** 追踪每个邮箱的 DB 插入次数 */
let insertCountByEmail: Map<string, number>;

// ─── Mock 设置 ────────────────────────────────────────────────────────────────────

// Mock Redis 缓存模块
vi.mock("@/lib/redis/cache", () => ({
  getCachedEmailStatus: vi.fn(),
  setCachedEmailStatus: vi.fn(),
}));

// Mock Redis 限流模块
vi.mock("@/lib/redis/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}));

// Mock 中间件模块
vi.mock("@/lib/middleware", () => ({
  createFormMiddlewarePipeline: vi.fn(() => {
    return async (
      _request: unknown,
      context: { requestId: string; clientIp: string }
    ) => {
      context.requestId = "test-request-id";
      context.clientIp = "127.0.0.1";
      return null;
    };
  }),
  addCorsHeaders: vi.fn((response: unknown) => response),
}));

// Mock 邮件模块
vi.mock("@/lib/email", () => ({
  fireWelcomeEmail: vi.fn(),
}));

// Mock 日志模块
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logSuccess: vi.fn(),
  logValidationFailed: vi.fn(),
  logPersistenceFailed: vi.fn(),
  generateRequestId: vi.fn(() => "test-request-id"),
}));

// 追踪当前正在处理的邮箱（用于 DB mock 内部判断）
let currentProcessingEmail = "";

// Mock DB 模块
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => {
            // 查询邮箱是否已存在于 "数据库"
            if (dbEmails.has(currentProcessingEmail)) {
              return [{ id: "existing-uuid" }];
            }
            return [];
          },
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => {
          // 执行插入操作
          dbEmails.add(currentProcessingEmail);
          insertCountByEmail.set(
            currentProcessingEmail,
            (insertCountByEmail.get(currentProcessingEmail) ?? 0) + 1
          );
          return [{ id: "new-uuid", unsubscribeToken: "unsub-token-uuid" }];
        },
      }),
    }),
  },
  withRetry: vi.fn((operation: () => Promise<unknown>) => operation()),
  pool: { end: vi.fn() },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({ type: "eq" })),
}));

// Mock 验证/消毒模块
vi.mock("@/lib/validation/sanitizer", () => ({
  sanitizeInput: vi.fn((input: string) => {
    // 追踪当前处理的邮箱（sanitizeInput 在 route 中对 email 调用）
    currentProcessingEmail = input.toLowerCase().trim();
    return input;
  }),
}));

vi.mock("@/lib/validation/schemas", () => ({
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
        error: { issues: [{ path: ["email"], message: "邮箱格式不正确" }] },
      };
    },
  },
}));

// Mock 错误类和常量
vi.mock("@/lib/errors", () => ({
  RateLimitError: class RateLimitError extends Error {
    retryAfter: number;
    constructor(retryAfter: number) {
      super("Rate limited");
      this.retryAfter = retryAfter;
    }
  },
}));

vi.mock("@/types/api", () => ({
  ERROR_CODES: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    RATE_LIMITED: "RATE_LIMITED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  },
  FORM_TYPES: {
    NEWSLETTER: "newsletter",
  },
}));

// ─── 导入被测模块和 mock 引用 ─────────────────────────────────────────────────────

import { POST } from "@/app/api/forms/newsletter/route";
import { getCachedEmailStatus, setCachedEmailStatus } from "@/lib/redis/cache";

const mockedGetCachedEmailStatus = vi.mocked(getCachedEmailStatus);
const mockedSetCachedEmailStatus = vi.mocked(setCachedEmailStatus);

// ─── 辅助工具 ────────────────────────────────────────────────────────────────────

/**
 * 生成有效邮箱地址的 fast-check arbitrary
 */
const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,19}$/),
    fc.stringMatching(/^[a-z]{1,15}$/),
    fc.stringMatching(/^[a-z]{2,6}$/)
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * 生成提交次数 N (1-10)
 */
const submissionCountArb = fc.integer({ min: 1, max: 10 });

/**
 * 创建模拟的 NextRequest 对象
 */
function createMockRequest(email: string): NextRequest {
  const body = JSON.stringify({ email });
  return new NextRequest("http://localhost/api/forms/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

// ─── 属性测试 ────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 8: Newsletter Subscription Idempotence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbEmails = new Set();
    cacheEmails = new Set();
    insertCountByEmail = new Map();
    currentProcessingEmail = "";

    // 配置 Redis 缓存 mock 行为
    mockedGetCachedEmailStatus.mockImplementation(async (email: string) => {
      const normalized = email.toLowerCase().trim();
      return cacheEmails.has(normalized) ? true : null;
    });
    mockedSetCachedEmailStatus.mockImplementation(
      async (email: string) => {
        const normalized = email.toLowerCase().trim();
        cacheEmails.add(normalized);
      }
    );
  });

  it("**Validates: Requirements 4.3** - 同一邮箱提交 N 次，所有响应成功且仅执行 1 次 DB 插入", async () => {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        submissionCountArb,
        async (email, submissionCount) => {
          // 重置状态
          dbEmails = new Set();
          cacheEmails = new Set();
          insertCountByEmail = new Map();

          // 重新配置缓存 mock（因为状态重置了）
          mockedGetCachedEmailStatus.mockImplementation(async (emailArg: string) => {
            const normalized = emailArg.toLowerCase().trim();
            return cacheEmails.has(normalized) ? true : null;
          });
          mockedSetCachedEmailStatus.mockImplementation(async (emailArg: string) => {
            const normalized = emailArg.toLowerCase().trim();
            cacheEmails.add(normalized);
          });

          // 提交 N 次相同邮箱
          for (let i = 0; i < submissionCount; i++) {
            const request = createMockRequest(email);
            const response = await POST(request);
            const body = await response.json();

            // 验证: 每次都返回 success: true
            expect(body.success).toBe(true);
          }

          // 验证: 仅执行 1 次 DB 插入
          const normalizedEmail = email.toLowerCase().trim();
          const inserts = insertCountByEmail.get(normalizedEmail) ?? 0;
          expect(inserts).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("**Validates: Requirements 4.3** - 不同邮箱各提交多次，每个邮箱仅产生 1 条 DB 记录", async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成 2-5 个不同邮箱
        fc.array(validEmailArb, { minLength: 2, maxLength: 5 }),
        submissionCountArb,
        async (emails, submissionsPerEmail) => {
          // 重置状态
          dbEmails = new Set();
          cacheEmails = new Set();
          insertCountByEmail = new Map();

          // 重新配置缓存 mock
          mockedGetCachedEmailStatus.mockImplementation(async (emailArg: string) => {
            const normalized = emailArg.toLowerCase().trim();
            return cacheEmails.has(normalized) ? true : null;
          });
          mockedSetCachedEmailStatus.mockImplementation(async (emailArg: string) => {
            const normalized = emailArg.toLowerCase().trim();
            cacheEmails.add(normalized);
          });

          // 去重（fast-check 可能生成相同邮箱）
          const uniqueEmails = [...new Set(emails.map((e) => e.toLowerCase().trim()))];

          // 对每个唯一邮箱提交 N 次
          for (const emailAddr of uniqueEmails) {
            for (let i = 0; i < submissionsPerEmail; i++) {
              const request = createMockRequest(emailAddr);
              const response = await POST(request);
              const body = await response.json();

              // 验证: 每次都返回 success: true
              expect(body.success).toBe(true);
            }
          }

          // 验证: 每个邮箱仅执行 1 次 DB 插入
          for (const emailAddr of uniqueEmails) {
            const inserts = insertCountByEmail.get(emailAddr) ?? 0;
            expect(inserts).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
