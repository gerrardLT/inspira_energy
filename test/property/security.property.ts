/**
 * Property 11: Server Error Information Hiding
 *
 * 对于任何 500/503 内部服务器错误：
 * - 响应 body 不包含堆栈追踪（如 "at Function", "at Object" 等）
 * - 响应 body 不包含内部文件路径（.ts, .js, .tsx, .jsx 扩展名）
 * - 响应 body 不包含 node_modules 路径
 * - 响应 body 不包含数据库表名（lp_interest_submissions, developer_submissions 等）
 * - 响应 body 不包含第三方服务标识（redis, postgresql, postgres, pg）
 * - 错误消息为固定的非描述性字符串
 *
 * **Validates: Requirements 10.3**
 *
 * Tag: Feature: backend-infrastructure, Property 11: Server Error Information Hiding
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createInternalErrorResponse,
  createServiceUnavailableResponse,
} from "@/lib/response";

// ─── 敏感信息模式定义 ──────────────────────────────────────────────────────────────

/** 文件路径模式：包含 .ts/.js/.tsx/.jsx 扩展名 */
const FILE_PATH_PATTERN = /\.(ts|js|tsx|jsx)\b/;

/** 堆栈追踪模式：如 "at Function", "at Object.<anonymous>", "at Module._compile" */
const STACK_TRACE_PATTERN = /at\s+(Function|Object|Module|Array|Promise|async|new|internal)/i;

/** node_modules 路径 */
const NODE_MODULES_PATTERN = /node_modules/i;

/** 数据库表名 */
const TABLE_NAME_PATTERN = /\b(lp_interest_submissions|developer_submissions|contact_submissions|newsletter_subscriptions)\b/;

/** 第三方服务标识 */
const SERVICE_ID_PATTERN = /\b(redis|postgresql|postgres|pg|ioredis|nodemailer|drizzle)\b/i;

/** 内部路径结构 */
const INTERNAL_PATH_PATTERN = /(\/|\\)(src|lib|app|node_modules)(\/|\\)/;

// ─── 自定义生成器 ──────────────────────────────────────────────────────────────────

/** 生成包含文件路径的内部错误消息 */
const filePathErrors = fc.oneof(
  fc.constant("Error in /src/lib/db/index.ts:42"),
  fc.constant("Cannot find module at ./src/app/api/forms/lp-interest/route.ts"),
  fc.constant("TypeError at src/lib/validation/schemas.js:128"),
  fc.constant("Failed to import C:\\project\\inspira_energy\\src\\lib\\errors.tsx"),
  fc.constant("ENOENT: no such file, src/lib/email/index.jsx"),
  fc.tuple(
    fc.constantFrom("src/", "lib/", "app/api/", "./"),
    fc.string({ minLength: 3, maxLength: 20 }).filter((s) => /^[a-z-]+$/.test(s)),
    fc.constantFrom(".ts", ".js", ".tsx", ".jsx")
  ).map(([prefix, name, ext]) => `Error loading ${prefix}${name}${ext}`)
);

/** 生成包含堆栈追踪的内部错误消息 */
const stackTraceErrors = fc.oneof(
  fc.constant(
    "Error: Connection refused\n    at Function.connect (node_modules/pg/lib/client.js:123)\n    at Object.<anonymous> (src/lib/db/index.ts:45)"
  ),
  fc.constant(
    "TypeError: Cannot read property 'query' of undefined\n    at Module._compile (internal/modules/cjs/loader.js:999)"
  ),
  fc.constant(
    "at async Object.submitLPInterest (/src/lib/services/form-service.ts:87:5)"
  ),
  fc.constant(
    "    at new Promise (<anonymous>)\n    at Function.drizzle (node_modules/drizzle-orm/pg-core/index.js:42)"
  ),
  fc.constant("RangeError: Maximum call stack size exceeded\n    at Array.forEach (<anonymous>)")
);

/** 生成包含 node_modules 路径的错误消息 */
const nodeModulesErrors = fc.oneof(
  fc.constant("Error at node_modules/ioredis/built/redis.js:312"),
  fc.constant("Cannot resolve 'pg' in node_modules/drizzle-orm"),
  fc.constant("Module not found: node_modules/nodemailer/lib/smtp-transport.js"),
  fc.constantFrom("ioredis", "drizzle-orm", "nodemailer", "pg", "pino").map(
    (pkg) => `Unhandled error in node_modules/${pkg}/index.js`
  )
);

/** 生成包含数据库表名的错误消息 */
const tableNameErrors = fc.oneof(
  fc.constant("duplicate key value violates unique constraint on lp_interest_submissions"),
  fc.constant("relation \"developer_submissions\" does not exist"),
  fc.constant("ERROR: null value in column \"email\" of relation \"contact_submissions\""),
  fc.constant("INSERT INTO newsletter_subscriptions failed: connection reset"),
  fc.constantFrom(
    "lp_interest_submissions",
    "developer_submissions",
    "contact_submissions",
    "newsletter_subscriptions"
  ).map((table) => `Failed to insert into ${table}: timeout`)
);

/** 生成包含服务标识的错误消息 */
const serviceIdErrors = fc.oneof(
  fc.constant("Redis connection to 127.0.0.1:6379 refused"),
  fc.constant("PostgreSQL error: FATAL: password authentication failed"),
  fc.constant("pg Pool: Cannot acquire connection from pool"),
  fc.constant("ioredis: MaxRetriesPerRequestError"),
  fc.constant("nodemailer: SMTP connection timeout"),
  fc.constant("drizzle: Query execution failed"),
  fc.constantFrom("redis", "postgresql", "postgres", "pg", "ioredis", "nodemailer", "drizzle").map(
    (svc) => `Service ${svc} is not responding`
  )
);

/** 综合：生成包含各类内部信息的错误消息 */
const internalInfoErrors = fc.oneof(
  filePathErrors,
  stackTraceErrors,
  nodeModulesErrors,
  tableNameErrors,
  serviceIdErrors
);

// ─── 辅助函数 ──────────────────────────────────────────────────────────────────────

/** 从 NextResponse 中提取 JSON body 并序列化为完整字符串 */
async function extractFullResponseString(response: Response): Promise<string> {
  const body = await response.json();
  return JSON.stringify(body);
}

/** 验证字符串不包含任何敏感内部信息 */
function assertNoInternalInfo(serialized: string): void {
  expect(serialized).not.toMatch(FILE_PATH_PATTERN);
  expect(serialized).not.toMatch(STACK_TRACE_PATTERN);
  expect(serialized).not.toMatch(NODE_MODULES_PATTERN);
  expect(serialized).not.toMatch(TABLE_NAME_PATTERN);
  expect(serialized).not.toMatch(SERVICE_ID_PATTERN);
  expect(serialized).not.toMatch(INTERNAL_PATH_PATTERN);
}

// ─── 属性测试 ──────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 11: Server Error Information Hiding", () => {
  it("createInternalErrorResponse: 无论内部发生何种错误，500 响应不泄露任何内部信息", () => {
    fc.assert(
      fc.asyncProperty(internalInfoErrors, async (_internalError) => {
        // 无论内部错误消息包含什么敏感信息，
        // createInternalErrorResponse 都不接受参数，始终返回固定消息
        const response = createInternalErrorResponse();
        const serialized = await extractFullResponseString(response);

        // 验证响应不包含任何内部信息
        assertNoInternalInfo(serialized);

        // 验证 HTTP 状态码为 500
        expect(response.status).toBe(500);

        // 验证响应结构正确
        const body = JSON.parse(serialized);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(typeof body.error.message).toBe("string");
        expect(body.error.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("createServiceUnavailableResponse: 无论内部发生何种错误，503 响应不泄露任何内部信息", () => {
    fc.assert(
      fc.asyncProperty(internalInfoErrors, async (_internalError) => {
        // 无论内部错误消息包含什么敏感信息，
        // createServiceUnavailableResponse 都不接受参数，始终返回固定消息
        const response = createServiceUnavailableResponse();
        const serialized = await extractFullResponseString(response);

        // 验证响应不包含任何内部信息
        assertNoInternalInfo(serialized);

        // 验证 HTTP 状态码为 503
        expect(response.status).toBe(503);

        // 验证响应结构正确
        const body = JSON.parse(serialized);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
        expect(typeof body.error.message).toBe("string");
        expect(body.error.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("500/503 响应使用固定消息：即使 AppError 携带内部信息，响应也不泄露", () => {
    fc.assert(
      fc.asyncProperty(internalInfoErrors, async (internalError) => {
        // 模拟场景：即使有人错误地将内部错误信息传递到响应构建阶段，
        // createInternalErrorResponse 和 createServiceUnavailableResponse
        // 仍然使用固定消息，永远不会暴露传入的错误详情

        // 500 响应
        const response500 = createInternalErrorResponse();
        const body500 = await response500.json();
        // 验证固定消息不包含传入的内部错误信息
        expect(JSON.stringify(body500)).not.toContain(internalError);

        // 503 响应
        const response503 = createServiceUnavailableResponse();
        const body503 = await response503.json();
        // 验证固定消息不包含传入的内部错误信息
        expect(JSON.stringify(body503)).not.toContain(internalError);
      }),
      { numRuns: 100 }
    );
  });

  it("500/503 响应的 error.message 为固定字符串（不随请求变化）", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        async (callCount) => {
          // 多次调用，验证消息始终一致
          const messages500 = new Set<string>();
          const messages503 = new Set<string>();

          for (let i = 0; i < callCount; i++) {
            const res500 = createInternalErrorResponse();
            const body500 = await res500.json();
            messages500.add(body500.error.message);

            const res503 = createServiceUnavailableResponse();
            const body503 = await res503.json();
            messages503.add(body503.error.message);
          }

          // 所有调用应返回相同的固定消息
          expect(messages500.size).toBe(1);
          expect(messages503.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
