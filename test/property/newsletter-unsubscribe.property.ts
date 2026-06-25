/**
 * Property 9: Newsletter Unsubscribe Token Handling
 *
 * 验证 Newsletter 退订端点的 token 处理逻辑：
 * - 有效 token（存在于数据库中的 UUID）→ 成功退订，状态更新为 "unsubscribed"
 * - 无效格式 token（非 UUID 字符串、空字符串、部分 UUID）→ 400 错误
 * - 有效 UUID 格式但不存在于数据库中 → 404 错误
 *
 * **Validates: Requirements 4.7, 4.8**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

// ─── Mock 设置 ────────────────────────────────────────────────────────────────────

// 模拟数据库中的订阅记录存储
let mockSubscriptions: Array<{
  id: string;
  email: string;
  subscribedAt: Date;
  status: "active" | "unsubscribed";
  unsubscribeToken: string;
}> = [];

// 跟踪 DB 更新操作
let mockUpdateCalls: Array<{ token: string; status: string }> = [];

// Mock drizzle-orm/pg-core 用于 schema 导入
vi.mock("drizzle-orm/pg-core", () => ({
  pgTable: () => ({}),
  pgEnum: () => () => ({}),
  uuid: () => ({ defaultRandom: () => ({ primaryKey: () => ({}), notNull: () => ({ unique: () => ({}) }) }) }),
  varchar: () => ({ notNull: () => ({ unique: () => ({}) }) }),
  text: () => ({}),
  timestamp: () => ({ defaultNow: () => ({ notNull: () => ({}) }) }),
  jsonb: () => ({ notNull: () => ({}), default: () => ({}) }),
  numeric: () => ({ notNull: () => ({}) }),
}));

// Mock drizzle-orm 的 eq 函数
vi.mock("drizzle-orm", () => ({
  eq: (field: unknown, value: string) => ({ field, value }),
}));

// Mock 数据库模块
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (condition: { value: string }) => {
          const token = condition.value;
          const found = mockSubscriptions.filter(
            (s) => s.unsubscribeToken === token
          );
          return Promise.resolve(found);
        },
      }),
    }),
    update: () => ({
      set: (data: { status: string }) => ({
        where: (condition: { value: string }) => {
          mockUpdateCalls.push({ token: condition.value, status: data.status });
          return Promise.resolve();
        },
      }),
    }),
  },
  withRetry: async <T>(operation: () => Promise<T>) => operation(),
}));

// Mock schema（需要一个占位导出）
vi.mock("@/lib/db/schema", () => ({
  newsletterSubscriptions: {
    unsubscribeToken: "unsubscribe_token",
    status: "status",
  },
  submissionStatusEnum: () => ({}),
  newsletterStatusEnum: () => ({}),
  contactFormTypeEnum: () => ({}),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  generateRequestId: () => "00000000-0000-4000-8000-000000000001",
  logSuccess: vi.fn(),
  logValidationFailed: vi.fn(),
}));

// Mock middleware
vi.mock("@/lib/middleware", () => ({
  composeMiddleware: () => async () => null,
  requestIdMiddleware: () => async () => null,
  clientIpMiddleware: () => async () => null,
  corsMiddleware: () => async () => null,
  methodEnforcementMiddleware: () => async () => null,
  addCorsHeaders: (response: unknown) => response,
}));

// Mock errors
vi.mock("@/lib/errors", async () => {
  const actual = await vi.importActual("@/lib/errors");
  return actual;
});

// ─── Generators ──────────────────────────────────────────────────────────────────

/** 生成有效的 UUID v4 字符串 */
const validUuidV4Arb = fc.uuid().filter((uuid) => {
  // 确保是标准 UUID 格式
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
});

/** 生成无效 token（非 UUID 格式字符串） */
const invalidTokenArb = fc.oneof(
  // 空字符串
  fc.constant(""),
  // 纯数字
  fc.integer({ min: 1, max: 999999 }).map(String),
  // 随机非 UUID 字符串
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => {
    return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  }),
  // 部分 UUID（截断）
  fc.uuid().map((uuid) => uuid.slice(0, Math.floor(Math.random() * 30) + 1)),
  // 含有非法字符的 UUID 格式
  fc.constant("zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"),
  fc.constant("12345678-1234-1234-1234-12345678"),
  // 有多余字符的 UUID
  fc.uuid().map((uuid) => uuid + "-extra"),
  // 特殊字符注入
  fc.constant("<script>alert('xss')</script>"),
  fc.constant("../../../etc/passwd"),
  fc.constant("null"),
);

/** 生成有效的邮箱地址 */
const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
    fc.stringMatching(/^[a-z]{2,8}$/),
    fc.constantFrom("com", "org", "net", "io", "sg")
  )
  .map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/**
 * 创建模拟的 GET 请求
 */
function createUnsubscribeRequest(token: string): NextRequest {
  const url = `http://localhost:3000/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
  return new NextRequest(url, { method: "GET" });
}

/**
 * 创建不带 token 参数的请求
 */
function createUnsubscribeRequestWithoutToken(): NextRequest {
  const url = "http://localhost:3000/api/newsletter/unsubscribe";
  return new NextRequest(url, { method: "GET" });
}

/**
 * 向 mock 数据库添加一条订阅记录
 */
function addMockSubscription(email: string, token: string): void {
  mockSubscriptions.push({
    id: crypto.randomUUID(),
    email,
    subscribedAt: new Date(),
    status: "active",
    unsubscribeToken: token,
  });
}

// ─── Property Tests ──────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 9: Newsletter Unsubscribe Token Handling", () => {
  beforeEach(() => {
    mockSubscriptions = [];
    mockUpdateCalls = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSubscriptions = [];
    mockUpdateCalls = [];
  });

  it("有效 token（存在于数据库中的活跃订阅）→ 200 成功 + 状态更新为 unsubscribed", async () => {
    const { GET } = await import("@/app/api/newsletter/unsubscribe/route");

    await fc.assert(
      fc.asyncProperty(validUuidV4Arb, validEmailArb, async (token, email) => {
        // 清理状态
        mockSubscriptions = [];
        mockUpdateCalls = [];

        // 在 mock DB 中添加活跃订阅
        addMockSubscription(email, token);

        // 发起退订请求
        const request = createUnsubscribeRequest(token);
        const response = await GET(request);
        const body = await response.json();

        // 验证：返回 200 成功
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
        expect(body.data.message).toBeDefined();

        // 验证：DB 更新被调用，状态设为 unsubscribed
        expect(mockUpdateCalls.length).toBe(1);
        expect(mockUpdateCalls[0].token).toBe(token);
        expect(mockUpdateCalls[0].status).toBe("unsubscribed");
      }),
      { numRuns: 100 }
    );
  });

  it("无效格式 token（非 UUID 字符串）→ 400 错误", async () => {
    const { GET } = await import("@/app/api/newsletter/unsubscribe/route");

    await fc.assert(
      fc.asyncProperty(invalidTokenArb, async (token) => {
        // 清理状态
        mockSubscriptions = [];
        mockUpdateCalls = [];

        // 空 token 走的是"缺少参数"逻辑，但仍应返回 400
        const request = token === ""
          ? createUnsubscribeRequestWithoutToken()
          : createUnsubscribeRequest(token);
        const response = await GET(request);
        const body = await response.json();

        // 验证：返回 400 错误
        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();
        expect(body.error.code).toBeDefined();

        // 验证：没有执行数据库更新
        expect(mockUpdateCalls.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("有效 UUID 格式但不存在于数据库中 → 404 错误", async () => {
    const { GET } = await import("@/app/api/newsletter/unsubscribe/route");

    await fc.assert(
      fc.asyncProperty(validUuidV4Arb, async (token) => {
        // 清理状态 - 确保数据库中没有此 token 对应的记录
        mockSubscriptions = [];
        mockUpdateCalls = [];

        // 发起退订请求（token 格式有效但不在数据库中）
        const request = createUnsubscribeRequest(token);
        const response = await GET(request);
        const body = await response.json();

        // 验证：返回 404 错误
        expect(response.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();
        expect(body.error.code).toBeDefined();
        expect(body.error.message).toBeDefined();

        // 验证：没有执行数据库更新
        expect(mockUpdateCalls.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
