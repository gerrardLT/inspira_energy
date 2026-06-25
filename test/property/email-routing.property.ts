/**
 * Property 13: Email Routing Correctness
 *
 * 对于任何成功的表单提交，Email_Service 应根据表单类型将团队通知路由到正确的收件人：
 * - "lp-interest" → EMAIL_IR_TEAM
 * - "contact-investor" → EMAIL_IR_TEAM
 * - "developer" → EMAIL_DEV_TEAM
 * - "contact-general" → EMAIL_SUPPORT_TEAM
 *
 * **Validates: Requirements 6.2**
 *
 * Tag: Feature: backend-infrastructure, Property 13: Email Routing Correctness
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";

// ─── 模拟环境变量 ──────────────────────────────────────────────────────────────────

const TEST_IR_TEAM = "ir-team@inspiraenergy.com";
const TEST_DEV_TEAM = "dev-team@inspiraenergy.com";
const TEST_SUPPORT_TEAM = "support-team@inspiraenergy.com";

// ─── Mock nodemailer ──────────────────────────────────────────────────────────────

const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: mockSendMail,
    }),
  },
}));

// ─── 自定义生成器 ──────────────────────────────────────────────────────────────────

type FormType = "lp-interest" | "developer" | "contact-investor" | "contact-general";

/** 生成表单类型 */
const arbitraryFormType: fc.Arbitrary<FormType> = fc.constantFrom(
  "lp-interest",
  "developer",
  "contact-investor",
  "contact-general"
);

/** 生成随机表单数据（适用于所有表单类型） */
const arbitraryFormData = (formType: FormType): fc.Arbitrary<Record<string, unknown>> => {
  switch (formType) {
    case "lp-interest":
      return fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        institution: fc.string({ minLength: 1, maxLength: 200 }),
        email: fc.emailAddress(),
        fundTypes: fc.array(fc.constantFrom("solar", "wind", "hydro"), {
          minLength: 1,
          maxLength: 3,
        }),
      });
    case "developer":
      return fc.record({
        companyName: fc.string({ minLength: 1, maxLength: 200 }),
        contactName: fc.string({ minLength: 1, maxLength: 100 }),
        email: fc.emailAddress(),
        region: fc.constantFrom("东南亚", "中国", "日本", "韩国"),
        projectType: fc.constantFrom("solar", "wind", "hydro"),
        capacityMw: fc.double({ min: 0.1, max: 10000, noNaN: true }),
      });
    case "contact-investor":
      return fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        company: fc.string({ minLength: 1, maxLength: 200 }),
        email: fc.emailAddress(),
        fundTypes: fc.array(fc.constantFrom("solar", "wind"), { minLength: 0, maxLength: 2 }),
      });
    case "contact-general":
      return fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        email: fc.emailAddress(),
        message: fc.string({ minLength: 1, maxLength: 500 }),
      });
  }
};

// ─── 路由规则映射 ──────────────────────────────────────────────────────────────────

const EXPECTED_ROUTING: Record<FormType, string> = {
  "lp-interest": TEST_IR_TEAM,
  "contact-investor": TEST_IR_TEAM,
  "developer": TEST_DEV_TEAM,
  "contact-general": TEST_SUPPORT_TEAM,
};

// ─── 属性测试 ──────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 13: Email Routing Correctness", () => {
  beforeEach(() => {
    mockSendMail.mockClear();

    // 设置邮件环境变量
    process.env.EMAIL_IR_TEAM = TEST_IR_TEAM;
    process.env.EMAIL_DEV_TEAM = TEST_DEV_TEAM;
    process.env.EMAIL_SUPPORT_TEAM = TEST_SUPPORT_TEAM;
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@test.com";
    process.env.SMTP_PASS = "test-pass";
    process.env.SMTP_FROM = "noreply@inspiraenergy.com";
  });

  afterEach(() => {
    delete process.env.EMAIL_IR_TEAM;
    delete process.env.EMAIL_DEV_TEAM;
    delete process.env.EMAIL_SUPPORT_TEAM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  it("sendTeamNotification 根据 formType 路由到正确的团队收件人", async () => {
    // 动态导入以确保 mock 生效
    const { createEmailService } = await import("@/lib/email/index");

    await fc.assert(
      fc.asyncProperty(arbitraryFormType, async (formType) => {
        // 生成对应类型的随机表单数据
        const formData = fc.sample(arbitraryFormData(formType), 1)[0];

        mockSendMail.mockClear();

        const emailService = createEmailService();
        await emailService.sendTeamNotification({
          formType,
          formData,
        });

        // 验证 sendMail 被调用
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        // 验证路由到正确的收件人
        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.to).toBe(EXPECTED_ROUTING[formType]);
      }),
      { numRuns: 100 }
    );
  });

  it("lp-interest 表单通知路由到 IR 团队", async () => {
    const { createEmailService } = await import("@/lib/email/index");

    await fc.assert(
      fc.asyncProperty(arbitraryFormData("lp-interest"), async (formData) => {
        mockSendMail.mockClear();

        const emailService = createEmailService();
        await emailService.sendTeamNotification({
          formType: "lp-interest",
          formData,
        });

        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail.mock.calls[0][0].to).toBe(TEST_IR_TEAM);
      }),
      { numRuns: 100 }
    );
  });

  it("contact-investor 表单通知路由到 IR 团队", async () => {
    const { createEmailService } = await import("@/lib/email/index");

    await fc.assert(
      fc.asyncProperty(arbitraryFormData("contact-investor"), async (formData) => {
        mockSendMail.mockClear();

        const emailService = createEmailService();
        await emailService.sendTeamNotification({
          formType: "contact-investor",
          formData,
        });

        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail.mock.calls[0][0].to).toBe(TEST_IR_TEAM);
      }),
      { numRuns: 100 }
    );
  });

  it("developer 表单通知路由到开发团队", async () => {
    const { createEmailService } = await import("@/lib/email/index");

    await fc.assert(
      fc.asyncProperty(arbitraryFormData("developer"), async (formData) => {
        mockSendMail.mockClear();

        const emailService = createEmailService();
        await emailService.sendTeamNotification({
          formType: "developer",
          formData,
        });

        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail.mock.calls[0][0].to).toBe(TEST_DEV_TEAM);
      }),
      { numRuns: 100 }
    );
  });

  it("contact-general 表单通知路由到支持团队", async () => {
    const { createEmailService } = await import("@/lib/email/index");

    await fc.assert(
      fc.asyncProperty(arbitraryFormData("contact-general"), async (formData) => {
        mockSendMail.mockClear();

        const emailService = createEmailService();
        await emailService.sendTeamNotification({
          formType: "contact-general",
          formData,
        });

        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail.mock.calls[0][0].to).toBe(TEST_SUPPORT_TEAM);
      }),
      { numRuns: 100 }
    );
  });
});
