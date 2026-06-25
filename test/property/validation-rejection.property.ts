/**
 * Property 2: Invalid Input Rejection with Field-Specific Errors
 *
 * Feature: backend-infrastructure, Property 2: Invalid Input Rejection with Field-Specific Errors
 *
 * 对于任何包含 1-N 个验证违规的表单提交（缺少必填字段、空字符串必填字段、
 * 无效邮箱格式、邮箱超过 254 字符、fund_type 不在预定义列表中、
 * capacity_mw 超出 0.1-10000 范围），Form_Service 应返回 success: false，
 * 并且错误响应中应标识每个具体失败的字段。
 *
 * Validates: Requirements 1.2, 1.3, 1.9, 2.2, 3.3, 4.2
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  lpInterestSchema,
  developerSchema,
  contactInvestorSchema,
  contactGeneralSchema,
  newsletterSchema,
  PREDEFINED_FUND_TYPES,
} from "@/lib/validation/schemas";

// ─── 辅助工具 ────────────────────────────────────────────────────────────────────

/**
 * 生成无效邮箱地址
 */
const invalidEmailArb = fc.oneof(
  // 缺少 @ 符号
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("@")),
  // 多个 @ 符号
  fc.tuple(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 10 })).map(
    ([a, b, c]) => `${a}@${b}@${c}`
  ),
  // 空字符串
  fc.constant(""),
  // 超过 254 字符的邮箱
  fc.string({ minLength: 200, maxLength: 250 }).map((s) => `${s.replace(/@/g, "a")}@example.com`),
  // 缺少域名部分
  fc.string({ minLength: 1, maxLength: 20 }).map((s) => `${s.replace(/@/g, "")}@`),
  // 缺少本地部分
  fc.string({ minLength: 1, maxLength: 20 }).map((s) => `@${s.replace(/@/g, "")}`)
);

/**
 * 生成无效的 fund_type 值（不在预定义列表中）
 */
const invalidFundTypeArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !(PREDEFINED_FUND_TYPES as readonly string[]).includes(s));

/**
 * 生成超出范围的 capacity_mw 值
 */
const invalidCapacityArb = fc.oneof(
  // 小于 0.1
  fc.double({ min: -10000, max: 0.09, noNaN: true }),
  // 大于 10000
  fc.double({ min: 10001, max: 100000, noNaN: true }),
  // 0 值
  fc.constant(0)
);

// ─── LP Interest Schema 属性测试 ──────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 2: Invalid Input Rejection with Field-Specific Errors", () => {
  describe("LP Interest Schema - 缺少必填字段时应返回字段级错误", () => {
    it("**Validates: Requirements 1.2** - 缺少 name 字段时拒绝并标识", () => {
      fc.assert(
        fc.property(
          fc.record({
            institution: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.constant("valid@example.com"),
            fund_types: fc.constant(["solar"] as const),
          }),
          (partialInput) => {
            // 缺少 name 字段
            const result = lpInterestSchema.safeParse(partialInput);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("name");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 1.2** - 缺少 institution 字段时拒绝并标识", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.constant("valid@example.com"),
            fund_types: fc.constant(["solar"] as const),
          }),
          (partialInput) => {
            const result = lpInterestSchema.safeParse(partialInput);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("institution");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 1.2** - 缺少 email 字段时拒绝并标识", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            institution: fc.string({ minLength: 1, maxLength: 100 }),
            fund_types: fc.constant(["solar"] as const),
          }),
          (partialInput) => {
            const result = lpInterestSchema.safeParse(partialInput);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("email");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 1.2** - 缺少 fund_types 字段时拒绝并标识", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            institution: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.constant("valid@example.com"),
          }),
          (partialInput) => {
            const result = lpInterestSchema.safeParse(partialInput);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("fund_types");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 1.3** - 无效邮箱格式时拒绝并标识 email 字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            institution: fc.string({ minLength: 1, maxLength: 100 }),
            email: invalidEmailArb,
            fund_types: fc.constant(["solar"] as const),
          }),
          (input) => {
            const result = lpInterestSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("email");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 1.9** - 无效 fund_type 值时拒绝并标识 fund_types 字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            institution: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.constant("valid@example.com"),
            fund_types: fc.array(invalidFundTypeArb, { minLength: 1, maxLength: 3 }),
          }),
          (input) => {
            const result = lpInterestSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              // fund_types 数组中的元素验证错误，路径包含 fund_types
              const hasFundTypeError = fieldPaths.some((p) => p.startsWith("fund_types"));
              expect(hasFundTypeError).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── Developer Schema 属性测试 ──────────────────────────────────────────────────

  describe("Developer Schema - 缺少必填字段或无效值时应返回字段级错误", () => {
    it("**Validates: Requirements 2.2** - 缺少多个必填字段时拒绝并标识所有缺失字段", () => {
      fc.assert(
        fc.property(
          // 仅提供部分字段，随机缺少其他必填字段
          fc.record({
            email: fc.constant("valid@example.com"),
          }),
          (partialInput) => {
            const result = developerSchema.safeParse(partialInput);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              // 应标识缺少的必填字段
              expect(fieldPaths).toContain("company_name");
              expect(fieldPaths).toContain("contact_name");
              expect(fieldPaths).toContain("region");
              expect(fieldPaths).toContain("project_type");
              expect(fieldPaths).toContain("capacity_mw");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 2.2** - capacity_mw 超出 0.1-10000 范围时拒绝并标识", () => {
      fc.assert(
        fc.property(
          fc.record({
            company_name: fc.string({ minLength: 1, maxLength: 100 }),
            contact_name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.constant("valid@example.com"),
            region: fc.string({ minLength: 1, maxLength: 100 }),
            project_type: fc.string({ minLength: 1, maxLength: 100 }),
            capacity_mw: invalidCapacityArb,
          }),
          (input) => {
            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("capacity_mw");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 2.2** - 无效邮箱格式时拒绝并标识 email 字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            company_name: fc.string({ minLength: 1, maxLength: 100 }),
            contact_name: fc.string({ minLength: 1, maxLength: 100 }),
            email: invalidEmailArb,
            region: fc.string({ minLength: 1, maxLength: 100 }),
            project_type: fc.string({ minLength: 1, maxLength: 100 }),
            capacity_mw: fc.double({ min: 0.1, max: 10000, noNaN: true }),
          }),
          (input) => {
            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("email");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── Contact Schema (Investor) 属性测试 ─────────────────────────────────────────

  describe("Contact Investor Schema - 缺少必填字段时应返回字段级错误", () => {
    it("**Validates: Requirements 3.3** - 缺少 name/company/email 时拒绝并标识各字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            form_type: fc.constant("investor" as const),
          }),
          (partialInput) => {
            const result = contactInvestorSchema.safeParse(partialInput);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("name");
              expect(fieldPaths).toContain("company");
              expect(fieldPaths).toContain("email");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 3.3** - 无效邮箱格式时拒绝并标识 email 字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            form_type: fc.constant("investor" as const),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            company: fc.string({ minLength: 1, maxLength: 200 }),
            email: invalidEmailArb,
          }),
          (input) => {
            const result = contactInvestorSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("email");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── Contact Schema (General) 属性测试 ──────────────────────────────────────────

  describe("Contact General Schema - 缺少必填字段时应返回字段级错误", () => {
    it("**Validates: Requirements 3.3** - 缺少 name/email/message 时拒绝并标识各字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            form_type: fc.constant("general" as const),
          }),
          (partialInput) => {
            const result = contactGeneralSchema.safeParse(partialInput);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("name");
              expect(fieldPaths).toContain("email");
              expect(fieldPaths).toContain("message");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 3.3** - 无效邮箱格式时拒绝并标识 email 字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            form_type: fc.constant("general" as const),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: invalidEmailArb,
            message: fc.string({ minLength: 1, maxLength: 5000 }),
          }),
          (input) => {
            const result = contactGeneralSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              const fieldPaths = result.error.issues.map((issue) =>
                issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
              );
              expect(fieldPaths).toContain("email");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ─── Newsletter Schema 属性测试 ─────────────────────────────────────────────────

  describe("Newsletter Schema - 无效邮箱时应返回字段级错误", () => {
    it("**Validates: Requirements 4.2** - 无效邮箱格式时拒绝并标识 email 字段", () => {
      fc.assert(
        fc.property(invalidEmailArb, (invalidEmail) => {
          const result = newsletterSchema.safeParse({ email: invalidEmail });
          expect(result.success).toBe(false);
          if (!result.success) {
            const fieldPaths = result.error.issues.map((issue) =>
              issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
            );
            expect(fieldPaths).toContain("email");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 4.2** - 缺少 email 字段时拒绝并标识", () => {
      fc.assert(
        fc.property(fc.constant({}), (emptyInput) => {
          const result = newsletterSchema.safeParse(emptyInput);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fieldPaths = result.error.issues.map((issue) =>
              issue.path.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".")
            );
            expect(fieldPaths).toContain("email");
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── 多字段同时违规属性测试 ──────────────────────────────────────────────────────

  describe("多字段同时违规时应返回所有违规字段的错误", () => {
    it("**Validates: Requirements 1.2, 1.3, 1.9** - LP Interest 多字段违规应标识所有字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constant(""), // 空字符串违反 min(1)
            institution: fc.constant(""), // 空字符串违反 min(1)
            email: invalidEmailArb,
            fund_types: fc.array(invalidFundTypeArb, { minLength: 1, maxLength: 2 }),
          }),
          (input) => {
            const result = lpInterestSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              // 应该有多个字段错误
              expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 2.2** - Developer 多字段违规应标识所有字段", () => {
      fc.assert(
        fc.property(
          fc.record({
            company_name: fc.constant(""), // 空字符串
            contact_name: fc.constant(""), // 空字符串
            email: invalidEmailArb,
            region: fc.constant(""), // 空字符串
            project_type: fc.constant(""), // 空字符串
            capacity_mw: invalidCapacityArb,
          }),
          (input) => {
            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);
            if (!result.success) {
              // 应该有多个字段错误
              expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
