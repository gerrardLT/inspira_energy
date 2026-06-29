/**
 * Webhook 消息格式化属性测试
 *
 * Property 12: Webhook 消息格式化完整性
 *
 * **Validates: Requirements 5.3, 5.4**
 *
 * Test framework: Vitest + fast-check v4
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

import {
  formatMessage,
  formatWeChatMessage,
  formatFeishuMessage,
  formatSlackMessage,
  type WebhookPlatform,
  type NotificationPayload,
} from "@/lib/webhook/formatters";

// ─── 生成器定义 ──────────────────────────────────────────────────────────────────

/**
 * 安全字符串生成器 — 避免 JSON 转义字符（引号、反斜杠），
 * 确保 JSON.stringify 后值在序列化输出中仍可通过 includes 匹配
 */
const safeStringArb = (minLength: number, maxLength: number) =>
  fc
    .stringMatching(new RegExp(`^[a-zA-Z0-9 _\\-]{${minLength},${maxLength}}$`))
    .filter((s) => s.trim().length > 0);

/** NotificationPayload 任意生成器 */
const payloadArb: fc.Arbitrary<NotificationPayload> = fc.record({
  formType: fc.constantFrom("lp-interest", "developer", "contact", "newsletter"),
  name: safeStringArb(1, 30),
  email: fc.emailAddress(),
  timestamp: fc.date({ min: new Date("2000-01-01"), max: new Date("2099-12-31"), noInvalidDate: true }).map((d) => d.toISOString()),
  summary: fc.dictionary(
    safeStringArb(1, 10),
    safeStringArb(1, 30),
    { minKeys: 1, maxKeys: 5 }
  ),
});

/** 平台生成器 */
const platformArb: fc.Arbitrary<WebhookPlatform> = fc.constantFrom("wechat", "feishu", "slack");

// ─── Property 12: Webhook 消息格式化完整性 ────────────────────────────────────────

// Feature: backend-operations, Property 12: Webhook 消息格式化完整性
describe("Feature: backend-operations, Property 12: Webhook 消息格式化完整性", () => {
  describe("通用属性：所有平台消息包含必需字段", () => {
    it("对任意 NotificationPayload 和任意平台，formatMessage 返回非 null 对象", () => {
      fc.assert(
        fc.property(platformArb, payloadArb, (platform, payload) => {
          const result = formatMessage(platform, payload);

          expect(result).not.toBeNull();
          expect(result).not.toBeUndefined();
          expect(typeof result).toBe("object");
        }),
        { numRuns: 100 }
      );
    });

    it("对任意 NotificationPayload 和任意平台，序列化消息包含所有必需字段值", () => {
      fc.assert(
        fc.property(platformArb, payloadArb, (platform, payload) => {
          const result = formatMessage(platform, payload);
          const serialized = JSON.stringify(result);

          // 必需字段值应出现在序列化消息中
          expect(serialized).toContain(payload.formType);
          expect(serialized).toContain(payload.name);
          expect(serialized).toContain(payload.email);
          expect(serialized).toContain(payload.timestamp);
        }),
        { numRuns: 100 }
      );
    });

    it("对任意 NotificationPayload 和任意平台，所有 summary 键值对出现在序列化消息中", () => {
      fc.assert(
        fc.property(platformArb, payloadArb, (platform, payload) => {
          const result = formatMessage(platform, payload);
          const serialized = JSON.stringify(result);

          // 所有 summary 的键和值应出现在序列化消息中
          for (const [key, value] of Object.entries(payload.summary)) {
            expect(serialized).toContain(key);
            expect(serialized).toContain(value);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("WeChat Work 平台消息结构规范", () => {
    it("WeChat 消息具有 msgtype: 'markdown' 和 markdown.content 字段", () => {
      fc.assert(
        fc.property(payloadArb, (payload) => {
          const result = formatWeChatMessage(payload) as Record<string, unknown>;

          expect(result).toHaveProperty("msgtype", "markdown");
          expect(result).toHaveProperty("markdown");

          const markdown = result.markdown as Record<string, unknown>;
          expect(markdown).toHaveProperty("content");
          expect(typeof markdown.content).toBe("string");
          expect((markdown.content as string).length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("WeChat 通过 formatMessage 调用时结构一致", () => {
      fc.assert(
        fc.property(payloadArb, (payload) => {
          const result = formatMessage("wechat", payload) as Record<string, unknown>;

          expect(result).toHaveProperty("msgtype", "markdown");
          expect(result).toHaveProperty("markdown");

          const markdown = result.markdown as Record<string, unknown>;
          expect(markdown).toHaveProperty("content");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Feishu 平台消息结构规范", () => {
    it("Feishu 消息具有 msg_type: 'interactive' 和 card 字段", () => {
      fc.assert(
        fc.property(payloadArb, (payload) => {
          const result = formatFeishuMessage(payload) as Record<string, unknown>;

          expect(result).toHaveProperty("msg_type", "interactive");
          expect(result).toHaveProperty("card");

          const card = result.card as Record<string, unknown>;
          expect(card).toHaveProperty("header");
          expect(card).toHaveProperty("elements");
          expect(Array.isArray(card.elements)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("Feishu 通过 formatMessage 调用时结构一致", () => {
      fc.assert(
        fc.property(payloadArb, (payload) => {
          const result = formatMessage("feishu", payload) as Record<string, unknown>;

          expect(result).toHaveProperty("msg_type", "interactive");
          expect(result).toHaveProperty("card");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Slack 平台消息结构规范", () => {
    it("Slack 消息具有 blocks 数组", () => {
      fc.assert(
        fc.property(payloadArb, (payload) => {
          const result = formatSlackMessage(payload) as Record<string, unknown>;

          expect(result).toHaveProperty("blocks");
          expect(Array.isArray(result.blocks)).toBe(true);
          expect((result.blocks as unknown[]).length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("Slack 通过 formatMessage 调用时结构一致", () => {
      fc.assert(
        fc.property(payloadArb, (payload) => {
          const result = formatMessage("slack", payload) as Record<string, unknown>;

          expect(result).toHaveProperty("blocks");
          expect(Array.isArray(result.blocks)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
