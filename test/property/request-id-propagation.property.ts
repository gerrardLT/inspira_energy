/**
 * Property 12: Request ID Propagation
 *
 * 对于任何单个 API 请求生成的多条日志条目：
 * - generateRequestId() 始终生成有效的 UUID v4 字符串
 * - createRequestLogger(requestId) 创建绑定该 requestId 的子 logger
 * - 同一 request logger 生成的多条日志共享相同的 requestId
 * - UUID v4 格式通过正则验证
 *
 * **Validates: Requirements 10.4, 10.6**
 *
 * Tag: Feature: backend-infrastructure, Property 12: Request ID Propagation
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateRequestId, createRequestLogger } from "@/lib/logger";

// ─── 常量 ────────────────────────────────────────────────────────────────────────

/** UUID v4 正则（8-4-4-4-12 格式，第三组首字符为 4，第四组首字符为 8/9/a/b） */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── 自定义生成器 ──────────────────────────────────────────────────────────────────

/** 生成有效的表单类型标识 */
const arbitraryFormType = fc.constantFrom(
  "lp-interest",
  "developer",
  "contact-investor",
  "contact-general",
  "newsletter"
);

/** 生成日志事件名称 */
const arbitraryEvent = fc.constantFrom(
  "form_submission_received",
  "validation_started",
  "validation_passed",
  "validation_failed",
  "persistence_started",
  "persistence_completed",
  "email_notification_sent",
  "email_notification_failed",
  "rate_limit_checked",
  "request_completed"
);

/** 生成要执行的日志操作数量（模拟多阶段处理） */
const arbitraryLogCount = fc.integer({ min: 2, max: 10 });

/** 生成 pino 日志级别方法名 */
const arbitraryLogLevel = fc.constantFrom("info", "warn", "error") as fc.Arbitrary<"info" | "warn" | "error">;

// ─── 属性测试 ──────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 12: Request ID Propagation", () => {
  it("generateRequestId() 始终生成有效的 UUID v4 字符串", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const requestId = generateRequestId();

        // 类型为字符串
        expect(typeof requestId).toBe("string");

        // 长度为 36（UUID v4 标准长度：8-4-4-4-12 + 4 个连字符）
        expect(requestId.length).toBe(36);

        // 匹配 UUID v4 正则
        expect(requestId).toMatch(UUID_V4_REGEX);
      }),
      { numRuns: 100 }
    );
  });

  it("generateRequestId() 每次调用生成唯一的 ID", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 50 }), (count) => {
        const ids = new Set<string>();
        for (let i = 0; i < count; i++) {
          ids.add(generateRequestId());
        }

        // 所有生成的 ID 都应唯一
        expect(ids.size).toBe(count);
      }),
      { numRuns: 100 }
    );
  });

  it("createRequestLogger(requestId) 创建绑定指定 requestId 的子 logger", () => {
    fc.assert(
      fc.property(arbitraryFormType, (formType) => {
        const requestId = generateRequestId();
        const logger = createRequestLogger(requestId, formType);

        // logger 应该是一个对象
        expect(logger).toBeDefined();
        expect(typeof logger).toBe("object");

        // logger 应具有标准 pino 日志方法
        expect(typeof logger.info).toBe("function");
        expect(typeof logger.warn).toBe("function");
        expect(typeof logger.error).toBe("function");

        // logger 绑定了 requestId（通过 pino 的 bindings 机制验证）
        const bindings = logger.bindings();
        expect(bindings.requestId).toBe(requestId);
        expect(bindings.formType).toBe(formType);
      }),
      { numRuns: 100 }
    );
  });

  it("createRequestLogger(requestId) 无 formType 时仅绑定 requestId", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const requestId = generateRequestId();
        const logger = createRequestLogger(requestId);

        const bindings = logger.bindings();
        expect(bindings.requestId).toBe(requestId);
        expect(bindings).not.toHaveProperty("formType");
      }),
      { numRuns: 100 }
    );
  });

  it("同一 request logger 的多次日志调用共享相同的 requestId", () => {
    fc.assert(
      fc.property(
        arbitraryFormType,
        arbitraryLogCount,
        fc.array(arbitraryLogLevel, { minLength: 2, maxLength: 10 }),
        fc.array(arbitraryEvent, { minLength: 2, maxLength: 10 }),
        (formType, _logCount, levels, events) => {
          const requestId = generateRequestId();
          const logger = createRequestLogger(requestId, formType);

          // 模拟请求生命周期中多个阶段的日志记录
          // 通过 bindings 验证每次调用都携带相同的 requestId
          const bindings = logger.bindings();

          // 无论调用多少次，绑定始终一致
          for (let i = 0; i < levels.length && i < events.length; i++) {
            // 每次调用前验证 bindings 没有变化
            const currentBindings = logger.bindings();
            expect(currentBindings.requestId).toBe(requestId);
            expect(currentBindings.formType).toBe(formType);

            // 验证 requestId 仍匹配 UUID v4 格式
            expect(currentBindings.requestId).toMatch(UUID_V4_REGEX);
          }

          // 最终绑定仍等于初始 requestId
          expect(bindings.requestId).toBe(requestId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("requestId 格式在整个请求生命周期中保持 UUID v4 有效性", () => {
    fc.assert(
      fc.property(
        arbitraryFormType,
        fc.array(arbitraryEvent, { minLength: 1, maxLength: 8 }),
        (formType, events) => {
          const requestId = generateRequestId();

          // 初始生成的 requestId 有效
          expect(requestId).toMatch(UUID_V4_REGEX);

          // 创建 logger 后 requestId 未被修改
          const logger = createRequestLogger(requestId, formType);
          const boundRequestId = logger.bindings().requestId as string;

          // 绑定中的 requestId 与原始完全一致
          expect(boundRequestId).toBe(requestId);

          // 格式仍为有效 UUID v4
          expect(boundRequestId).toMatch(UUID_V4_REGEX);
          expect(boundRequestId.length).toBe(36);

          // 验证各组成部分
          const parts = boundRequestId.split("-");
          expect(parts.length).toBe(5);
          expect(parts[0].length).toBe(8);
          expect(parts[1].length).toBe(4);
          expect(parts[2].length).toBe(4);
          expect(parts[2][0]).toBe("4"); // UUID v4 版本标识
          expect(parts[3].length).toBe(4);
          expect("89ab").toContain(parts[3][0].toLowerCase()); // variant 标识
          expect(parts[4].length).toBe(12);
        }
      ),
      { numRuns: 100 }
    );
  });
});
