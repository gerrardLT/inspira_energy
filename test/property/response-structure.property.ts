/**
 * Property 10: API Response Structure Invariant
 *
 * 对于任何 API 响应：
 * - 成功响应 body 匹配 { success: true, data?: object }
 * - 失败响应 body 匹配 { success: false, error: { code: string, message: string, fields?: Record<string, string> } }
 * - error.message 不超过 256 字符
 * - 500/503 错误响应使用固定消息，不暴露任何内部信息
 *
 * **Validates: Requirements 10.1, 10.2**
 *
 * Tag: Feature: backend-infrastructure, Property 10: API Response Structure Invariant
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createSuccessResponse,
  createErrorResponse,
  createInternalErrorResponse,
  createServiceUnavailableResponse,
} from "@/lib/response";

// ─── 自定义生成器 ──────────────────────────────────────────────────────────────────

/** 生成任意 JSON 可序列化的数据负载 */
const arbitraryData = fc.oneof(
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    value: fc.integer(),
  }),
  fc.record({
    items: fc.array(fc.string({ minLength: 0, maxLength: 50 }), {
      minLength: 0,
      maxLength: 5,
    }),
    count: fc.nat(),
  }),
  fc.record({
    email: fc.emailAddress(),
    status: fc.constantFrom("pending", "contacted", "closed"),
  }),
  fc.constant({ ok: true }),
  fc.constant({})
);

/** 生成有效的错误码 */
const arbitraryErrorCode = fc.constantFrom(
  "VALIDATION_ERROR",
  "INVALID_FILE_TYPE",
  "TOO_MANY_FILES",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "RATE_LIMITED",
  "METHOD_NOT_ALLOWED",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR"
);

/** 生成 ≤256 字符的短消息 */
const shortMessage = fc.string({ minLength: 1, maxLength: 256 });

/** 生成 >256 字符的长消息（用于验证截断行为） */
const longMessage = fc.string({ minLength: 257, maxLength: 1000 });

/** 生成任意长度的消息（含短消息和长消息） */
const arbitraryMessage = fc.oneof(shortMessage, longMessage);

/** 生成有效的 HTTP 错误状态码 */
const errorStatusCode = fc.constantFrom(400, 401, 403, 404, 405, 413, 415, 429, 500, 503);

/** 生成可选的字段级错误映射 */
const arbitraryFields = fc.oneof(
  fc.constant(undefined),
  fc.dictionary(
    fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-z_]+$/.test(s)),
    fc.string({ minLength: 1, maxLength: 100 }),
    { minKeys: 1, maxKeys: 5 }
  )
);

// ─── 辅助函数 ──────────────────────────────────────────────────────────────────────

/** 从 NextResponse 中提取 JSON body */
async function extractBody(response: Response): Promise<unknown> {
  return response.json();
}

// ─── 属性测试 ──────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 10: API Response Structure Invariant", () => {
  it("createSuccessResponse(data): body 匹配 { success: true, data? }", () => {
    fc.assert(
      fc.asyncProperty(arbitraryData, async (data) => {
        const response = createSuccessResponse(data);
        const body = (await extractBody(response)) as Record<string, unknown>;

        // success 必须为 true
        expect(body.success).toBe(true);

        // data 字段存在且等于输入
        expect(body.data).toEqual(data);

        // 不应包含 error 字段
        expect(body).not.toHaveProperty("error");

        // 响应结构只有 success 和 data 两个顶层字段
        const allowedKeys = ["success", "data"];
        for (const key of Object.keys(body)) {
          expect(allowedKeys).toContain(key);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("createSuccessResponse(): 无 data 参数时 body 匹配 { success: true }", () => {
    fc.assert(
      fc.asyncProperty(fc.constant(undefined), async () => {
        const response = createSuccessResponse();
        const body = (await extractBody(response)) as Record<string, unknown>;

        expect(body.success).toBe(true);
        expect(body).not.toHaveProperty("data");
        expect(body).not.toHaveProperty("error");

        // 只有 success 字段
        expect(Object.keys(body)).toEqual(["success"]);
      }),
      { numRuns: 100 }
    );
  });

  it("createErrorResponse(code, message, status, fields): body 匹配 { success: false, error: { code, message, fields? } }", () => {
    fc.assert(
      fc.asyncProperty(
        arbitraryErrorCode,
        shortMessage,
        errorStatusCode,
        arbitraryFields,
        async (code, message, status, fields) => {
          const response = createErrorResponse(code, message, status, fields);
          const body = (await extractBody(response)) as Record<string, unknown>;

          // success 必须为 false
          expect(body.success).toBe(false);

          // error 对象存在且结构正确
          expect(body).toHaveProperty("error");
          const error = body.error as Record<string, unknown>;

          expect(error.code).toBe(code);
          expect(typeof error.message).toBe("string");
          expect((error.message as string).length).toBeLessThanOrEqual(256);

          // fields 只在有值时存在
          if (fields !== undefined && Object.keys(fields).length > 0) {
            expect(error).toHaveProperty("fields");
            expect(error.fields).toEqual(fields);
          } else {
            expect(error).not.toHaveProperty("fields");
          }

          // 不应包含 data 字段
          expect(body).not.toHaveProperty("data");

          // 顶层只有 success 和 error
          const allowedKeys = ["success", "error"];
          for (const key of Object.keys(body)) {
            expect(allowedKeys).toContain(key);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("createErrorResponse: message > 256 字符时截断至 ≤ 256 字符", () => {
    fc.assert(
      fc.asyncProperty(
        arbitraryErrorCode,
        longMessage,
        errorStatusCode,
        async (code, message, status) => {
          const response = createErrorResponse(code, message, status);
          const body = (await extractBody(response)) as Record<string, unknown>;
          const error = body.error as Record<string, unknown>;

          // 消息长度不超过 256
          expect((error.message as string).length).toBeLessThanOrEqual(256);

          // 截断后以 "..." 结尾
          expect((error.message as string).endsWith("...")).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("createInternalErrorResponse(): 固定结构，不暴露内部信息", () => {
    fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const response = createInternalErrorResponse();
        const body = (await extractBody(response)) as Record<string, unknown>;

        // 基本结构验证
        expect(body.success).toBe(false);
        expect(body).toHaveProperty("error");
        expect(body).not.toHaveProperty("data");

        const error = body.error as Record<string, unknown>;

        // code 固定为 INTERNAL_ERROR
        expect(error.code).toBe("INTERNAL_ERROR");

        // message 是字符串且不超过 256 字符
        expect(typeof error.message).toBe("string");
        expect((error.message as string).length).toBeLessThanOrEqual(256);
        expect((error.message as string).length).toBeGreaterThan(0);

        // 不应包含 fields
        expect(error).not.toHaveProperty("fields");

        // HTTP 状态码为 500
        expect(response.status).toBe(500);

        // 固定消息不包含路径、堆栈、表名等内部信息
        const msg = error.message as string;
        expect(msg).not.toMatch(/\.(ts|js|tsx|jsx)/);
        expect(msg).not.toMatch(/at\s+\w+/); // stack trace pattern
        expect(msg).not.toMatch(/node_modules/);
        expect(msg).not.toMatch(/(\/|\\)(src|lib|app)\//);
      }),
      { numRuns: 100 }
    );
  });

  it("createServiceUnavailableResponse(): 固定结构，不暴露内部信息", () => {
    fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const response = createServiceUnavailableResponse();
        const body = (await extractBody(response)) as Record<string, unknown>;

        // 基本结构验证
        expect(body.success).toBe(false);
        expect(body).toHaveProperty("error");
        expect(body).not.toHaveProperty("data");

        const error = body.error as Record<string, unknown>;

        // code 固定为 SERVICE_UNAVAILABLE
        expect(error.code).toBe("SERVICE_UNAVAILABLE");

        // message 是字符串且不超过 256 字符
        expect(typeof error.message).toBe("string");
        expect((error.message as string).length).toBeLessThanOrEqual(256);
        expect((error.message as string).length).toBeGreaterThan(0);

        // 不应包含 fields
        expect(error).not.toHaveProperty("fields");

        // HTTP 状态码为 503
        expect(response.status).toBe(503);

        // 固定消息不包含路径、堆栈、表名等内部信息
        const msg = error.message as string;
        expect(msg).not.toMatch(/\.(ts|js|tsx|jsx)/);
        expect(msg).not.toMatch(/at\s+\w+/);
        expect(msg).not.toMatch(/node_modules/);
        expect(msg).not.toMatch(/(\/|\\)(src|lib|app)\//);
        expect(msg).not.toMatch(/redis|postgresql|postgres|pg/i);
      }),
      { numRuns: 100 }
    );
  });
});
