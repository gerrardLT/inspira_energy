/**
 * Property 3: Input Sanitization Invariant
 *
 * 对于任意文本输入字符串，经过消毒处理后：
 * - 输出不包含任何 <script> 标签（大小写不敏感）
 * - 输出不包含任何 HTML 事件处理器属性（onclick=, onerror=, onload= 等）
 * - 所有 HTML 特殊字符（<, >, &, ", '）均已编码为对应的 HTML 实体
 *
 * **Validates: Requirements 9.2**
 *
 * Tag: Feature: backend-infrastructure, Property 3: Input Sanitization Invariant
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sanitizeInput, sanitizeObject } from "@/lib/validation/sanitizer";

// ─── 自定义生成器 ──────────────────────────────────────────────────────────────────

/** 生成随机 script 标签注入 payload */
const scriptTagPayload = fc.oneof(
  fc.constant("<script>alert('xss')</script>"),
  fc.constant("<SCRIPT>document.cookie</SCRIPT>"),
  fc.constant("<Script>eval(atob('...'))</Script>"),
  fc.constant("<script src='evil.js'></script>"),
  fc.constant("<script\n>alert(1)</script>"),
  fc.constant("<script/>"),
  fc.constant("<script type='text/javascript'>fetch('/steal')</script>"),
  fc.string({ minLength: 0, maxLength: 20 }).map(
    (inner) => `<script>${inner}</script>`
  )
);

/** 生成随机事件处理器注入 payload */
const eventHandlerPayload = fc.oneof(
  fc.constant(' onclick="alert(1)"'),
  fc.constant(' onerror="steal()"'),
  fc.constant(' onload="hack()"'),
  fc.constant(' onmouseover="xss()"'),
  fc.constant(' onfocus="evil()"'),
  fc.constant(" ONCLICK='alert(1)'"),
  fc.constant(' onchange=alert(1)'),
  fc.constant(' onsubmit="send()"'),
  fc.constant(' oninput="capture()"')
);

/** 生成包含 HTML 特殊字符的字符串 */
const htmlSpecialCharsPayload = fc
  .array(
    fc.oneof(
      fc.constantFrom("<", ">", "&", '"', "'"),
      fc.string({ minLength: 1, maxLength: 5 })
    ),
    { minLength: 1, maxLength: 20 }
  )
  .map((parts) => parts.join(""));

/** 生成混合注入 payload（将 script 标签、事件处理器和普通文本混合） */
const mixedInjectionPayload = fc.tuple(
  fc.string({ minLength: 0, maxLength: 30 }),
  fc.oneof(scriptTagPayload, eventHandlerPayload, htmlSpecialCharsPayload),
  fc.string({ minLength: 0, maxLength: 30 })
).map(([prefix, payload, suffix]) => `${prefix}${payload}${suffix}`);

/** 生成任意字符串（包含可能的注入） */
const arbitraryInputWithInjection = fc.oneof(
  scriptTagPayload,
  eventHandlerPayload,
  htmlSpecialCharsPayload,
  mixedInjectionPayload,
  fc.string({ minLength: 0, maxLength: 200 })
);

// ─── 检测正则表达式 ─────────────────────────────────────────────────────────────────

/** 检测 <script 标签（大小写不敏感） */
const SCRIPT_TAG_DETECTOR = /<script/i;

/** 检测事件处理器属性模式 on[a-z]+= */
const EVENT_HANDLER_DETECTOR = /on[a-z]+\s*=/i;

// ─── 属性测试 ──────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 3: Input Sanitization Invariant", () => {
  it("sanitizeInput: 输出不包含任何 <script 标签（大小写不敏感）", () => {
    fc.assert(
      fc.property(arbitraryInputWithInjection, (input) => {
        const output = sanitizeInput(input);
        expect(output).not.toMatch(SCRIPT_TAG_DETECTOR);
      }),
      { numRuns: 100 }
    );
  });

  it("sanitizeInput: 输出不包含任何事件处理器属性（on[a-z]+=）", () => {
    fc.assert(
      fc.property(arbitraryInputWithInjection, (input) => {
        const output = sanitizeInput(input);
        expect(output).not.toMatch(EVENT_HANDLER_DETECTOR);
      }),
      { numRuns: 100 }
    );
  });

  it("sanitizeInput: 所有 HTML 特殊字符 <, >, &, \", ' 均已编码为实体", () => {
    fc.assert(
      fc.property(htmlSpecialCharsPayload, (input) => {
        const output = sanitizeInput(input);

        // 输出中不应包含未编码的特殊字符
        // 注意：& 可能出现在实体编码中（如 &lt;），所以需要排除这种情况
        // 我们检查是否存在独立的 < > " ' 字符（不是实体的一部分）
        // 以及 & 后面不跟已知实体模式的情况

        // 检查 < 和 > 不存在（它们应被编码为 &lt; 和 &gt;）
        expect(output).not.toContain("<");
        expect(output).not.toContain(">");

        // 检查双引号不存在（应编码为 &quot;）
        expect(output).not.toContain('"');

        // 检查单引号不存在（应编码为 &#x27;）
        expect(output).not.toContain("'");

        // 检查 & 只作为实体编码的一部分出现
        // 所有 & 都应该后跟 lt; gt; amp; quot; 或 #x27;
        const ampersandSegments = output.split("&").slice(1); // 忽略第一段（& 前的内容）
        for (const segment of ampersandSegments) {
          const isValidEntity =
            segment.startsWith("lt;") ||
            segment.startsWith("gt;") ||
            segment.startsWith("amp;") ||
            segment.startsWith("quot;") ||
            segment.startsWith("#x27;");
          expect(isValidEntity).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sanitizeInput: 对包含 script 标签的字符串，标签及内容被完全移除", () => {
    fc.assert(
      fc.property(scriptTagPayload, (input) => {
        const output = sanitizeInput(input);
        expect(output).not.toMatch(SCRIPT_TAG_DETECTOR);
      }),
      { numRuns: 100 }
    );
  });

  it("sanitizeInput: 对包含事件处理器的字符串，处理器属性被完全移除", () => {
    fc.assert(
      fc.property(eventHandlerPayload, (input) => {
        const output = sanitizeInput(input);
        expect(output).not.toMatch(EVENT_HANDLER_DETECTOR);
      }),
      { numRuns: 100 }
    );
  });

  it("sanitizeObject: 嵌套对象中所有字符串值均被正确消毒", () => {
    // 生成嵌套对象，其中值包含注入 payload
    const nestedObjectWithMalicious = fc.record({
      name: arbitraryInputWithInjection,
      nested: fc.record({
        description: arbitraryInputWithInjection,
        deep: fc.record({
          content: arbitraryInputWithInjection,
        }),
      }),
      items: fc.array(arbitraryInputWithInjection, { minLength: 1, maxLength: 3 }),
      safeNumber: fc.integer(),
      safeBoolean: fc.boolean(),
    });

    fc.assert(
      fc.property(nestedObjectWithMalicious, (obj) => {
        const result = sanitizeObject(obj as Record<string, unknown>);

        // 递归检查所有字符串值
        function assertAllStringsSanitized(value: unknown): void {
          if (typeof value === "string") {
            expect(value).not.toMatch(SCRIPT_TAG_DETECTOR);
            expect(value).not.toMatch(EVENT_HANDLER_DETECTOR);
            // 不应包含未编码的 < 或 >
            expect(value).not.toContain("<");
            expect(value).not.toContain(">");
          } else if (Array.isArray(value)) {
            value.forEach(assertAllStringsSanitized);
          } else if (value !== null && typeof value === "object") {
            Object.values(value).forEach(assertAllStringsSanitized);
          }
        }

        assertAllStringsSanitized(result);

        // 非字符串值保持不变
        expect(result.safeNumber).toBe(obj.safeNumber);
        expect(result.safeBoolean).toBe(obj.safeBoolean);
      }),
      { numRuns: 100 }
    );
  });
});
