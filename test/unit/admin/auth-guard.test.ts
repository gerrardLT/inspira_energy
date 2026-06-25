/**
 * API Key 认证属性测试
 *
 * Property 16: 常量时间比较函数正确性
 * Property 17: 认证失败信息不泄漏
 * Property 18: 认证失败日志完整性
 *
 * **Validates: Requirements 7.1, 7.3, 7.4**
 *
 * Test framework: Vitest + fast-check v4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

import { constantTimeEqual, apiKeyGuardMiddleware } from "@/lib/admin/auth-guard";
import type { RequestContext } from "@/lib/middleware";

// ─── Logger Mock ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    })),
  },
  generateRequestId: () => "test-request-id",
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
import { logger } from "@/lib/logger";

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────────

/** 创建模拟 NextRequest */
function createMockRequest(apiKey?: string, path = "/api/admin/test"): NextRequest {
  const headers = new Headers();
  if (apiKey !== undefined) {
    headers.set("x-api-key", apiKey);
  }
  const url = `http://localhost:3000${path}`;
  return new NextRequest(url, { headers });
}

/** 创建模拟 RequestContext */
function createMockContext(clientIp = "192.168.1.100"): RequestContext {
  return {
    requestId: "test-request-id",
    clientIp,
    locale: "zh",
  };
}

// ─── Property 16: 常量时间比较函数正确性 ──────────────────────────────────────────

// Feature: backend-operations, Property 16: 常量时间比较函数正确性
describe("Feature: backend-operations, Property 16: 常量时间比较函数正确性", () => {
  it("对任意两个字符串 a 和 b，constantTimeEqual(a, b) === true 当且仅当 a === b", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        const result = constantTimeEqual(a, b);
        const expected = a === b;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("自反性：对任意字符串 s，constantTimeEqual(s, s) === true", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(constantTimeEqual(s, s)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("对称性：constantTimeEqual(a, b) === constantTimeEqual(b, a)", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        expect(constantTimeEqual(a, b)).toBe(constantTimeEqual(b, a));
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 17: 认证失败信息不泄漏 ────────────────────────────────────────────

// Feature: backend-operations, Property 17: 认证失败信息不泄漏
describe("Feature: backend-operations, Property 17: 认证失败信息不泄漏", () => {
  const FIXED_API_KEY = "correct-api-key-abc123";

  beforeEach(() => {
    process.env.ADMIN_API_KEY = FIXED_API_KEY;
  });

  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  /** 生成各种无效 API Key：部分匹配、完全不同、特殊字符（非空） */
  const invalidKeyArb = fc.oneof(
    // 部分匹配（前缀相同）
    fc.string({ minLength: 1, maxLength: 10 }).map(
      (suffix) => FIXED_API_KEY.slice(0, Math.floor(FIXED_API_KEY.length / 2)) + suffix
    ),
    // 完全不同的随机字符串（非空，非空白）
    fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s.trim().length > 0 && s !== FIXED_API_KEY),
    // 包含特殊字符
    fc.string({ minLength: 1, maxLength: 32 }).map(
      (s) => `!@#$%^&*${s}`
    ),
    // 与正确 key 仅差一个字符
    fc.nat({ max: FIXED_API_KEY.length - 1 }).map((idx) => {
      const chars = FIXED_API_KEY.split("");
      chars[idx] = chars[idx] === "x" ? "y" : "x";
      return chars.join("");
    })
  );

  it("所有无效 API Key 返回相同的错误码和错误消息", async () => {
    await fc.assert(
      fc.asyncProperty(invalidKeyArb, async (invalidKey) => {
        const middleware = apiKeyGuardMiddleware();
        const request = createMockRequest(invalidKey);
        const context = createMockContext();

        const response = await middleware(request, context);

        // 必须返回非 null 响应（认证失败）
        expect(response).not.toBeNull();
        expect(response!.status).toBe(401);

        const body = await response!.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("UNAUTHORIZED");
        expect(body.error.message).toBe("Invalid credentials");
      }),
      { numRuns: 100 }
    );
  });

  it("无效 key 的错误消息不包含正确 key 的任何信息", async () => {
    await fc.assert(
      fc.asyncProperty(invalidKeyArb, async (invalidKey) => {
        const middleware = apiKeyGuardMiddleware();
        const request = createMockRequest(invalidKey);
        const context = createMockContext();

        const response = await middleware(request, context);
        expect(response).not.toBeNull();

        const body = await response!.json();
        const serialized = JSON.stringify(body);

        // 响应不包含正确 key 的值
        expect(serialized).not.toContain(FIXED_API_KEY);
        // 响应不包含 key 的格式或长度信息
        expect(serialized).not.toContain(String(FIXED_API_KEY.length));
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 18: 认证失败日志完整性 ────────────────────────────────────────────

// Feature: backend-operations, Property 18: 认证失败日志完整性
describe("Feature: backend-operations, Property 18: 认证失败日志完整性", () => {
  const FIXED_API_KEY = "test-admin-key-xyz789";

  beforeEach(() => {
    process.env.ADMIN_API_KEY = FIXED_API_KEY;
    vi.mocked(logger.warn).mockClear();
  });

  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  /** 生成任意合法 IPv4 地址 */
  const ipArb = fc
    .tuple(
      fc.nat({ max: 255 }),
      fc.nat({ max: 255 }),
      fc.nat({ max: 255 }),
      fc.nat({ max: 255 })
    )
    .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

  /** 生成任意请求路径 */
  const pathArb = fc
    .array(
      fc.stringMatching(/^[a-z0-9-]+$/).filter((s) => s.length > 0 && s.length <= 20),
      { minLength: 1, maxLength: 5 }
    )
    .map((segments) => `/api/${segments.join("/")}`);

  it("认证失败时 warn 日志包含 clientIp、requestPath 和有效的 ISO 8601 timestamp", async () => {
    await fc.assert(
      fc.asyncProperty(ipArb, pathArb, async (clientIp, requestPath) => {
        vi.mocked(logger.warn).mockClear();

        const middleware = apiKeyGuardMiddleware();
        const request = createMockRequest("wrong-key", requestPath);
        const context = createMockContext(clientIp);

        await middleware(request, context);

        // 验证 logger.warn 被调用
        expect(logger.warn).toHaveBeenCalled();

        // 获取日志调用参数
        const lastCall = vi.mocked(logger.warn).mock.calls[
          vi.mocked(logger.warn).mock.calls.length - 1
        ];
        const logData = lastCall[0] as Record<string, unknown>;

        // 验证日志包含 clientIp
        expect(logData).toHaveProperty("clientIp");
        expect(logData.clientIp).toBe(clientIp);

        // 验证日志包含 requestPath
        expect(logData).toHaveProperty("requestPath");
        expect(logData.requestPath).toBe(requestPath);

        // 验证日志包含 timestamp 且为有效 ISO 8601 格式
        expect(logData).toHaveProperty("timestamp");
        const timestamp = logData.timestamp as string;
        const parsed = new Date(timestamp);
        expect(parsed.toISOString()).toBe(timestamp);
        // timestamp 应该是合理的时间（不是 Invalid Date）
        expect(Number.isNaN(parsed.getTime())).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("缺少 API Key 时 warn 日志同样包含完整字段", async () => {
    await fc.assert(
      fc.asyncProperty(ipArb, pathArb, async (clientIp, requestPath) => {
        vi.mocked(logger.warn).mockClear();

        const middleware = apiKeyGuardMiddleware();
        // 不提供 X-API-Key 头
        const request = createMockRequest(undefined, requestPath);
        const context = createMockContext(clientIp);

        await middleware(request, context);

        // 验证 logger.warn 被调用
        expect(logger.warn).toHaveBeenCalled();

        const lastCall = vi.mocked(logger.warn).mock.calls[
          vi.mocked(logger.warn).mock.calls.length - 1
        ];
        const logData = lastCall[0] as Record<string, unknown>;

        // 验证所有三个必需字段
        expect(logData).toHaveProperty("clientIp", clientIp);
        expect(logData).toHaveProperty("requestPath", requestPath);
        expect(logData).toHaveProperty("timestamp");

        const timestamp = logData.timestamp as string;
        const parsed = new Date(timestamp);
        expect(parsed.toISOString()).toBe(timestamp);
        expect(Number.isNaN(parsed.getTime())).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
