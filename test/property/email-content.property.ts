/**
 * Property 14: Email Notification Content Completeness
 *
 * 对于任何成功的表单提交，团队通知邮件 body 应包含所有用户提交的字段值（经 HTML 实体转义后）。
 * 不允许遗漏任何已提交的字段值。
 *
 * **Validates: Requirements 6.3**
 *
 * Tag: Feature: backend-infrastructure, Property 14: Email Notification Content Completeness
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  buildTeamNotificationHtml,
  type NotificationFormType,
} from "@/lib/email/templates/team-notification";

// ─── 辅助函数 ──────────────────────────────────────────────────────────────────────

/**
 * 模拟 buildTeamNotificationHtml 内部使用的 escapeHtml 逻辑
 * 与源码保持一致，用于预期值比对
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 将 formData 中的值转换为预期出现在 HTML 中的字符串形式
 * 与源码中的处理逻辑一致：
 * - 数组使用 ", " 连接
 * - 其他值使用 String() 转换
 */
function toDisplayValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

// ─── 自定义生成器 ──────────────────────────────────────────────────────────────────

/** 生成有效的表单类型 */
const arbitraryFormType: fc.Arbitrary<NotificationFormType> = fc.constantFrom(
  "lp-interest",
  "developer",
  "contact-investor",
  "contact-general"
);

/**
 * 生成非空、非 null、非 undefined 的字段值
 * 覆盖字符串、数字、布尔值和字符串数组
 */
const nonEmptyFieldValue: fc.Arbitrary<unknown> = fc.oneof(
  // 非空字符串（含中文、特殊字符、HTML 实体等）
  fc.string({ minLength: 1, maxLength: 200 }),
  // 含特殊 HTML 字符的字符串
  fc.constantFrom(
    "张三 <admin>",
    'He said "hello" & goodbye',
    "it's a test",
    "value with <script>alert('xss')</script>",
    "A & B > C < D"
  ),
  // 中文字符串
  fc.constantFrom(
    "新能源基金",
    "光伏项目",
    "投资意向",
    "深圳市南山区",
    "风力发电"
  ),
  // 数字
  fc.integer({ min: 1, max: 99999 }),
  fc.double({ min: 0.1, max: 10000, noNaN: true }),
  // 布尔值
  fc.boolean(),
  // 非空字符串数组
  fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    minLength: 1,
    maxLength: 5,
  })
);

/** 生成合法的字段名（camelCase 或 snake_case） */
const fieldName: fc.Arbitrary<string> = fc.oneof(
  // 常见表单字段名
  fc.constantFrom(
    "name",
    "email",
    "phone",
    "institution",
    "position",
    "fundTypes",
    "regions",
    "investmentSize",
    "companyName",
    "contactName",
    "region",
    "projectType",
    "capacityMw",
    "projectStage",
    "notes",
    "company",
    "subject",
    "message"
  ),
  // 随机字段名（模拟未预定义的字段）
  fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
);

/**
 * 生成含 1-8 个非空字段的表单数据对象
 * 确保所有值都是非空、非 null、非 undefined 的
 */
const arbitraryFormData: fc.Arbitrary<Record<string, unknown>> = fc
  .array(fc.tuple(fieldName, nonEmptyFieldValue), { minLength: 1, maxLength: 8 })
  .map((entries) => {
    const data: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      data[key] = value;
    }
    return data;
  })
  // 确保至少有一个字段
  .filter((data) => Object.keys(data).length >= 1);

// ─── 属性测试 ──────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 14: Email Notification Content Completeness", () => {
  it("每个非空字段值（经 HTML 转义后）都应出现在通知邮件 HTML 中", () => {
    fc.assert(
      fc.property(arbitraryFormType, arbitraryFormData, (formType, formData) => {
        const html = buildTeamNotificationHtml(formType, formData);

        // 遍历所有字段，验证非空值出现在 HTML 中
        for (const [key, value] of Object.entries(formData)) {
          // 跳过空值（与源码行为一致）
          if (value === undefined || value === null || value === "") continue;

          const displayValue = toDisplayValue(value);
          const escapedValue = escapeHtml(displayValue);

          // 验证转义后的值出现在 HTML 输出中
          expect(html).toContain(escapedValue);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("包含特殊 HTML 字符的字段值在转义后仍能完整出现在通知邮件中", () => {
    fc.assert(
      fc.property(
        arbitraryFormType,
        fc.record({
          name: fc.constantFrom(
            '<script>alert("xss")</script>',
            "O'Brien & Partners",
            '"Quoted" Company',
            "A > B < C",
            "测试&公司<ltd>"
          ),
          email: fc.constantFrom(
            "test@example.com",
            "user+tag@domain.co",
            "admin@sub.domain.org"
          ),
        }),
        (formType, formData) => {
          const html = buildTeamNotificationHtml(formType, formData);

          for (const [, value] of Object.entries(formData)) {
            if (value === undefined || value === null || value === "") continue;

            const displayValue = toDisplayValue(value);
            const escapedValue = escapeHtml(displayValue);

            expect(html).toContain(escapedValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("数组类型的字段值以逗号分隔后出现在通知邮件中", () => {
    fc.assert(
      fc.property(
        arbitraryFormType,
        fc.record({
          fundTypes: fc.array(
            fc.constantFrom("股权基金", "债权基金", "混合基金", "Pre-IPO", "Green Bond"),
            { minLength: 1, maxLength: 4 }
          ),
          regions: fc.array(
            fc.constantFrom("华东", "华南", "华北", "西南", "Southeast Asia"),
            { minLength: 1, maxLength: 3 }
          ),
        }),
        (formType, formData) => {
          const html = buildTeamNotificationHtml(formType, formData);

          for (const [, value] of Object.entries(formData)) {
            if (value === undefined || value === null || value === "") continue;

            const displayValue = toDisplayValue(value);
            const escapedValue = escapeHtml(displayValue);

            expect(html).toContain(escapedValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("空值字段（null、undefined、空字符串）不应出现在通知邮件中", () => {
    fc.assert(
      fc.property(
        arbitraryFormType,
        fc.record({
          name: fc.constant("张三"),
          emptyField: fc.constant(""),
          nullField: fc.constant(null),
          undefinedField: fc.constant(undefined),
        }),
        (formType, formData) => {
          const html = buildTeamNotificationHtml(formType, formData);

          // 非空字段应存在
          expect(html).toContain(escapeHtml("张三"));

          // 验证 HTML 中有值的行只包含非空字段
          // 空/null/undefined 字段的 key 不应作为标签出现
          // （因为源码 continue 了这些字段）
          const emptyFieldLabels = ["emptyField", "nullField", "undefinedField"];
          for (const label of emptyFieldLabels) {
            // 这些字段名不在 FIELD_LABELS 映射中，所以直接用 key 作为标签
            // 由于值为空被 continue 跳过，标签也不应出现
            expect(html).not.toContain(`>${label}</td>`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
