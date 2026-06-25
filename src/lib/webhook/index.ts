/**
 * Webhook 通知服务
 *
 * 负责向配置的即时通讯平台（企业微信/飞书/Slack）发送异步通知。
 * 采用 fire-and-forget 模式，不阻塞业务流程。
 *
 * 特性：
 * - 异步发射不等待（fire-and-forget）— 返回类型为 void
 * - 失败重试 2 次（共 3 次尝试），固定 3 秒间隔
 * - 每次请求超时 10 秒（AbortController）
 * - WEBHOOK_URL 未配置时静默跳过（不记录错误日志）
 * - 所有尝试失败后记录 error 日志但不影响业务流程
 * - 永不抛出异常
 *
 * Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8
 */

import { formatMessage, type NotificationPayload, type WebhookPlatform } from "./formatters";
import { logger } from "@/lib/logger";

// ─── 常量配置 ────────────────────────────────────────────────────────────────────

/** 最大尝试次数（1 次初始 + 2 次重试） */
const MAX_ATTEMPTS = 3;

/** 重试间隔（毫秒） */
const RETRY_DELAY_MS = 3_000;

/** 请求超时（毫秒） */
const REQUEST_TIMEOUT_MS = 10_000;

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/** 延时等待 */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── 内部异步发送逻辑 ────────────────────────────────────────────────────────────

/**
 * 内部异步发送函数
 * 执行实际的 HTTP 请求、重试和错误处理
 * 永不抛出 — 所有异常在内部捕获并记录日志
 */
async function sendWithRetry(
  webhookUrl: string,
  platform: WebhookPlatform,
  payload: NotificationPayload
): Promise<void> {
  const body = JSON.stringify(formatMessage(platform, payload));
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // 发送成功，直接返回
        return;
      }

      // 非 2xx 响应，记录为错误并准备重试
      lastError = new Error(
        `Webhook request failed with status ${response.status}: ${response.statusText}`
      );
    } catch (error: unknown) {
      // 网络错误或超时
      lastError = error;
    }

    // 如果还有重试机会，等待后重试
    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  // 所有尝试均失败，记录 error 日志
  logger.error(
    {
      event: "webhook_delivery_failed",
      platform,
      webhookUrl,
      formType: payload.formType,
      attempts: MAX_ATTEMPTS,
      lastError: lastError instanceof Error ? lastError.message : String(lastError),
    },
    "Webhook notification delivery failed after all retry attempts"
  );
}

// ─── 导出服务 ────────────────────────────────────────────────────────────────────

export const WebhookService = {
  /**
   * 异步发送 Webhook 通知（fire-and-forget）
   *
   * - 不阻塞调用方（返回 void，不返回 Promise）
   * - WEBHOOK_URL 未配置或为空时静默跳过
   * - 内部异步执行：格式化消息 → POST 请求 → 重试 → 错误日志
   *
   * @param payload - 通知载荷
   */
  sendNotificationAsync(payload: NotificationPayload): void {
    // 在调用时读取环境变量（支持运行时动态配置）
    const webhookUrl = process.env.WEBHOOK_URL;
    const platform = process.env.WEBHOOK_PLATFORM as WebhookPlatform | undefined;

    // WEBHOOK_URL 未配置或为空时静默跳过，不记录错误日志
    if (!webhookUrl) {
      return;
    }

    // 平台默认为 wechat（防御性处理，env.ts 已验证但此处额外保护）
    const resolvedPlatform: WebhookPlatform = platform || "wechat";

    // Fire-and-forget：调用异步函数但不 await
    void sendWithRetry(webhookUrl, resolvedPlatform, payload);
  },
};

// ─── 导出类型（供外部使用） ───────────────────────────────────────────────────────

export type { NotificationPayload, WebhookPlatform } from "./formatters";
