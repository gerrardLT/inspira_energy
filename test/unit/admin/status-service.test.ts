/**
 * 状态更新服务属性测试
 *
 * Property 9: 状态更新持久化正确性
 * Property 10: 无效状态值验证
 *
 * **Validates: Requirements 3.1, 3.2, 3.5**
 *
 * Test framework: Vitest + fast-check v4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";

// ─── Mocks ───────────────────────────────────────────────────────────────────────

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
}));

vi.mock("@/lib/webhook", () => ({
  WebhookService: {
    sendNotificationAsync: vi.fn(),
  },
}));

/** Mock database pool */
const mockRelease = vi.fn();
const mockQuery = vi.fn();
const mockConnect = vi.fn().mockResolvedValue({
  query: mockQuery,
  release: mockRelease,
});

vi.mock("@/lib/db", () => ({
  pool: {
    connect: () => mockConnect(),
  },
}));

import { StatusService } from "@/lib/admin/status-service";
import { AppError } from "@/lib/errors";

// ─── Property 9: 状态更新持久化正确性 ────────────────────────────────────────────

// Feature: backend-operations, Property 9: 状态更新持久化正确性
describe("Feature: backend-operations, Property 9: 状态更新持久化正确性", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("对任意有效状态值，更新后返回的记录反映新状态且 updatedAt 为有效 ISO 8601 时间戳", async () => {
    const statusArb = fc.constantFrom("pending", "contacted", "closed") as fc.Arbitrary<
      "pending" | "contacted" | "closed"
    >;

    await fc.assert(
      fc.asyncProperty(statusArb, async (status) => {
        const now = new Date();
        const mockId = "550e8400-e29b-41d4-a716-446655440000";

        // Mock DB 返回成功结果
        mockQuery.mockResolvedValueOnce({
          rows: [
            {
              id: mockId,
              status,
              updated_at: now,
              name: "Test User",
              email: "test@test.com",
            },
          ],
        });

        const result = await StatusService.updateStatus("lp-interest", mockId, status);

        // 返回的 status 等于输入的 status
        expect(result.status).toBe(status);

        // updatedAt 是有效的 ISO 8601 时间戳
        const parsedDate = new Date(result.updatedAt);
        expect(Number.isNaN(parsedDate.getTime())).toBe(false);
        expect(parsedDate.toISOString()).toBe(result.updatedAt);

        // 时间戳应该在合理范围内（10 秒以内）
        const timeDiff = Math.abs(Date.now() - parsedDate.getTime());
        expect(timeDiff).toBeLessThan(10_000);
      }),
      { numRuns: 100 }
    );
  });

  it("对任意有效 formType（非 newsletter）和有效状态值，更新成功返回正确的 id", async () => {
    const formTypeArb = fc.constantFrom("lp-interest", "developer", "contact") as fc.Arbitrary<
      "lp-interest" | "developer" | "contact"
    >;
    const statusArb = fc.constantFrom("pending", "contacted", "closed") as fc.Arbitrary<
      "pending" | "contacted" | "closed"
    >;

    await fc.assert(
      fc.asyncProperty(formTypeArb, statusArb, async (formType, status) => {
        const mockId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        const now = new Date();

        mockQuery.mockResolvedValueOnce({
          rows: [
            {
              id: mockId,
              status,
              updated_at: now,
              name: "Test User",
              email: "test@test.com",
            },
          ],
        });

        const result = await StatusService.updateStatus(formType, mockId, status);

        expect(result.id).toBe(mockId);
        expect(result.status).toBe(status);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 10: 无效状态值验证 ─────────────────────────────────────────────────

// Feature: backend-operations, Property 10: 无效状态值验证
describe("Feature: backend-operations, Property 10: 无效状态值验证", () => {
  it("对任意非法字符串状态值，validateStatus 抛出 400 错误且消息包含允许值列表", () => {
    const invalidStatusArb = fc
      .string()
      .filter((s) => !["pending", "contacted", "closed"].includes(s));

    fc.assert(
      fc.property(invalidStatusArb, (invalidStatus) => {
        try {
          StatusService.validateStatus({ status: invalidStatus });
          // 不应到达此处
          expect.fail("Expected AppError to be thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          const appError = error as AppError;
          expect(appError.statusCode).toBe(400);
          expect(appError.code).toBe("VALIDATION_ERROR");
          // 错误消息包含允许值列表
          expect(appError.message).toContain("pending");
          expect(appError.message).toContain("contacted");
          expect(appError.message).toContain("closed");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("对非字符串类型输入（数字、对象、数组），validateStatus 抛出 400 错误", () => {
    const nonStringArb = fc.oneof(
      fc.integer().map((n) => ({ status: n })),
      fc.constant({ status: null }),
      fc.constant({ status: undefined }),
      fc.constant({ status: [] }),
      fc.constant({ status: {} }),
      fc.constant({ status: true }),
      fc.constant({}), // 缺少 status 字段
      fc.constant(null),
      fc.constant(42)
    );

    fc.assert(
      fc.property(nonStringArb, (invalidBody) => {
        try {
          StatusService.validateStatus(invalidBody);
          expect.fail("Expected AppError to be thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          const appError = error as AppError;
          expect(appError.statusCode).toBe(400);
          expect(appError.code).toBe("VALIDATION_ERROR");
          // 消息应提及允许的状态值
          expect(appError.message).toContain("pending");
          expect(appError.message).toContain("contacted");
          expect(appError.message).toContain("closed");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("有效状态值通过验证并返回该值", () => {
    const validStatusArb = fc.constantFrom("pending", "contacted", "closed");

    fc.assert(
      fc.property(validStatusArb, (validStatus) => {
        const result = StatusService.validateStatus({ status: validStatus });
        expect(result).toBe(validStatus);
      }),
      { numRuns: 100 }
    );
  });
});
