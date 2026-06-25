/**
 * 邮件服务模块
 *
 * 职责：
 * - 通过 SMTP 发送团队通知邮件（基于表单类型路由到对应团队）
 * - 发送提交者确认邮件（支持中/英双语）
 * - 发送 Newsletter 欢迎邮件（含退订链接）
 * - 指数退避重试机制（1s → 2s → 4s，最多 3 次）
 * - 异步非阻塞执行（fire-and-forget）
 *
 * 环境变量：
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * - EMAIL_IR_TEAM, EMAIL_DEV_TEAM, EMAIL_SUPPORT_TEAM
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { logger } from "@/lib/logger";
import {
  buildTeamNotificationHtml,
  getNotificationSubject,
  buildConfirmationHtml,
  buildWelcomeEmailHtml,
} from "./templates";

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

export interface TeamNotificationOptions {
  formType: "lp-interest" | "developer" | "contact-investor" | "contact-general";
  formData: Record<string, unknown>;
  fileLinks?: string[];
}

export interface ConfirmationOptions {
  email: string;
  formType: string;
  locale: string; // "zh" | "en"
}

export interface EmailService {
  sendTeamNotification(options: TeamNotificationOptions): Promise<void>;
  sendSubmitterConfirmation(options: ConfirmationOptions): Promise<void>;
  sendWelcomeEmail(email: string, unsubscribeToken: string, locale: string): Promise<void>;
}

// ─── SMTP 配置 ───────────────────────────────────────────────────────────────────

function createTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/** 延迟指定毫秒数 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── 邮件路由规则 ────────────────────────────────────────────────────────────────

/**
 * 根据表单类型获取目标收件人邮箱
 * - LP interest & investor contact → IR 团队
 * - Developer form → 开发团队
 * - General contact → 支持团队
 */
function getRecipientByFormType(
  formType: TeamNotificationOptions["formType"]
): string {
  switch (formType) {
    case "lp-interest":
    case "contact-investor":
      return process.env.EMAIL_IR_TEAM ?? "";
    case "developer":
      return process.env.EMAIL_DEV_TEAM ?? "";
    case "contact-general":
      return process.env.EMAIL_SUPPORT_TEAM ?? "";
  }
}

// ─── 邮件内容生成（已提取到 templates/ 模块） ─────────────────────────────────────

// ─── 指数退避重试 ────────────────────────────────────────────────────────────────

/**
 * 带指数退避重试的邮件发送包装器
 *
 * 策略：
 * - 初始延迟 1s，每次翻倍（1s → 2s → 4s）
 * - 最多重试 3 次
 * - 全部失败返回 false，由调用者标记 email_failed
 *
 * @param sendFn - 实际发送邮件的函数
 * @param requestId - 请求追踪 ID
 * @param maxRetries - 最大重试次数，默认 3
 * @returns true 表示发送成功，false 表示全部重试均失败
 */
export async function sendWithRetry(
  sendFn: () => Promise<void>,
  requestId: string,
  maxRetries = 3
): Promise<boolean> {
  let delay = 1000; // 起始 1s
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendFn();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown email error";
      logger.error(
        {
          requestId,
          attempt,
          maxRetries,
          error: errorMessage,
          event: "email_send_failed",
        },
        `Email send failed (attempt ${attempt}/${maxRetries})`
      );
      if (attempt < maxRetries) {
        await sleep(delay);
        delay *= 2; // 指数退避: 1s → 2s → 4s
      }
    }
  }
  return false; // 所有重试均失败
}

// ─── EmailService 实现 ───────────────────────────────────────────────────────────

/**
 * 创建邮件服务实例
 * 使用环境变量配置 SMTP 传输器
 */
export function createEmailService(): EmailService {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM ?? "noreply@inspiraenergy.com";

  return {
    /**
     * 发送团队通知邮件
     * 根据表单类型路由到对应团队收件人
     */
    async sendTeamNotification(options: TeamNotificationOptions): Promise<void> {
      const { formType, formData, fileLinks } = options;
      const to = getRecipientByFormType(formType);
      const subject = getNotificationSubject(formType);
      const html = buildTeamNotificationHtml(formType, formData, fileLinks);

      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
    },

    /**
     * 发送提交者确认邮件
     * 根据 locale 使用中文或英文模板
     */
    async sendSubmitterConfirmation(options: ConfirmationOptions): Promise<void> {
      const { email, formType, locale } = options;
      const effectiveLocale = locale === "zh" ? "zh" : "en";

      const subject =
        effectiveLocale === "zh"
          ? "[Inspira Energy] 感谢您的提交"
          : "[Inspira Energy] Thank You for Your Submission";

      const html = buildConfirmationHtml(formType, effectiveLocale);

      await transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });
    },

    /**
     * 发送 Newsletter 欢迎邮件
     * 包含退订链接
     */
    async sendWelcomeEmail(
      email: string,
      unsubscribeToken: string,
      locale: string
    ): Promise<void> {
      const effectiveLocale = locale === "zh" ? "zh" : "en";

      const subject =
        effectiveLocale === "zh"
          ? "[Inspira Energy] 欢迎订阅 Newsletter"
          : "[Inspira Energy] Welcome to Our Newsletter";

      const html = buildWelcomeEmailHtml(unsubscribeToken, effectiveLocale);

      await transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });
    },
  };
}

// ─── 异步邮件触发（Fire-and-Forget） ────────────────────────────────────────────

/**
 * 异步触发团队通知邮件（非阻塞）
 * 失败时记录日志并标记 email_failed，不影响 API 响应
 *
 * @param options - 通知选项
 * @param requestId - 请求追踪 ID
 * @param onAllRetriesFailed - 所有重试失败后的回调（用于标记 email_failed 状态）
 */
export function fireTeamNotification(
  options: TeamNotificationOptions,
  requestId: string,
  onAllRetriesFailed?: () => Promise<void>
): void {
  const emailService = createEmailService();

  // fire-and-forget: 不 await，不阻塞调用者
  void (async () => {
    const success = await sendWithRetry(
      () => emailService.sendTeamNotification(options),
      requestId
    );
    if (!success) {
      logger.error(
        {
          requestId,
          formType: options.formType,
          event: "email_all_retries_exhausted",
          result: "email_failed",
        },
        "Team notification email failed after all retries"
      );
      if (onAllRetriesFailed) {
        try {
          await onAllRetriesFailed();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          logger.error(
            { requestId, error: msg, event: "email_failed_callback_error" },
            "Failed to execute onAllRetriesFailed callback"
          );
        }
      }
    }
  })();
}

/**
 * 异步触发提交者确认邮件（非阻塞）
 * 失败时记录日志，不影响 API 响应
 *
 * @param options - 确认邮件选项
 * @param requestId - 请求追踪 ID
 * @param onAllRetriesFailed - 所有重试失败后的回调
 */
export function fireSubmitterConfirmation(
  options: ConfirmationOptions,
  requestId: string,
  onAllRetriesFailed?: () => Promise<void>
): void {
  const emailService = createEmailService();

  void (async () => {
    const success = await sendWithRetry(
      () => emailService.sendSubmitterConfirmation(options),
      requestId
    );
    if (!success) {
      logger.error(
        {
          requestId,
          email: options.email,
          event: "confirmation_email_all_retries_exhausted",
          result: "email_failed",
        },
        "Submitter confirmation email failed after all retries"
      );
      if (onAllRetriesFailed) {
        try {
          await onAllRetriesFailed();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          logger.error(
            { requestId, error: msg, event: "email_failed_callback_error" },
            "Failed to execute onAllRetriesFailed callback"
          );
        }
      }
    }
  })();
}

/**
 * 异步触发 Newsletter 欢迎邮件（非阻塞）
 * 失败时记录日志，不影响 API 响应
 *
 * @param email - 收件人邮箱
 * @param unsubscribeToken - 退订 token
 * @param locale - 语言偏好 (zh/en)
 * @param requestId - 请求追踪 ID
 * @param onAllRetriesFailed - 所有重试失败后的回调
 */
export function fireWelcomeEmail(
  email: string,
  unsubscribeToken: string,
  locale: string,
  requestId: string,
  onAllRetriesFailed?: () => Promise<void>
): void {
  const emailService = createEmailService();

  void (async () => {
    const success = await sendWithRetry(
      () => emailService.sendWelcomeEmail(email, unsubscribeToken, locale),
      requestId
    );
    if (!success) {
      logger.error(
        {
          requestId,
          email,
          event: "welcome_email_all_retries_exhausted",
          result: "email_failed",
        },
        "Newsletter welcome email failed after all retries"
      );
      if (onAllRetriesFailed) {
        try {
          await onAllRetriesFailed();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          logger.error(
            { requestId, error: msg, event: "email_failed_callback_error" },
            "Failed to execute onAllRetriesFailed callback"
          );
        }
      }
    }
  })();
}
