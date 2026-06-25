/**
 * Webhook 平台消息格式化器
 *
 * 根据目标平台将统一的通知载荷转换为平台特定的消息格式：
 * - WeChat Work（企业微信）：Markdown Card
 * - Feishu（飞书）：Interactive Card
 * - Slack：Block Kit
 *
 * Requirements: 5.3, 5.4
 */

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

/** 支持的 Webhook 平台 */
export type WebhookPlatform = "wechat" | "feishu" | "slack";

/** 通知载荷 — 所有平台格式化器的统一输入 */
export interface NotificationPayload {
  /** 表单类型标识 */
  formType: string;
  /** 提交者姓名 */
  name: string;
  /** 提交者邮箱 */
  email: string;
  /** 提交时间（ISO 8601 格式） */
  timestamp: string;
  /** 表单关键字段摘要（key-value 对） */
  summary: Record<string, string>;
}

// ─── WeChat Work 格式化器 ────────────────────────────────────────────────────────

/**
 * 格式化为企业微信 Markdown Card 消息
 *
 * @see https://developer.work.weixin.qq.com/document/path/91770
 */
export function formatWeChatMessage(payload: NotificationPayload): unknown {
  const summaryLines = Object.entries(payload.summary)
    .map(([key, value]) => `>${key}: ${value}`)
    .join("\n");

  const content = [
    "### 新表单提交通知",
    `>类型: ${payload.formType}`,
    `>姓名: ${payload.name}`,
    `>邮箱: ${payload.email}`,
    `>时间: ${payload.timestamp}`,
    "",
    "**摘要**",
    summaryLines,
  ].join("\n");

  return {
    msgtype: "markdown",
    markdown: {
      content,
    },
  };
}

// ─── Feishu 格式化器 ─────────────────────────────────────────────────────────────

/**
 * 格式化为飞书 Interactive Card 消息
 *
 * @see https://open.feishu.cn/document/common-capabilities/message-card/message-cards-content
 */
export function formatFeishuMessage(payload: NotificationPayload): unknown {
  const baseFields = [
    {
      is_short: true,
      text: {
        tag: "lark_md",
        content: `**类型:** ${payload.formType}`,
      },
    },
    {
      is_short: true,
      text: {
        tag: "lark_md",
        content: `**姓名:** ${payload.name}`,
      },
    },
    {
      is_short: true,
      text: {
        tag: "lark_md",
        content: `**邮箱:** ${payload.email}`,
      },
    },
    {
      is_short: true,
      text: {
        tag: "lark_md",
        content: `**时间:** ${payload.timestamp}`,
      },
    },
  ];

  const summaryFields = Object.entries(payload.summary).map(([key, value]) => ({
    is_short: true,
    text: {
      tag: "lark_md",
      content: `**${key}:** ${value}`,
    },
  }));

  return {
    msg_type: "interactive",
    card: {
      header: {
        title: {
          tag: "plain_text",
          content: "新表单提交通知",
        },
      },
      elements: [
        {
          tag: "div",
          fields: [...baseFields, ...summaryFields],
        },
      ],
    },
  };
}

// ─── Slack 格式化器 ──────────────────────────────────────────────────────────────

/**
 * 格式化为 Slack Block Kit 消息
 *
 * @see https://api.slack.com/reference/block-kit
 */
export function formatSlackMessage(payload: NotificationPayload): unknown {
  const baseFields = [
    { type: "mrkdwn", text: `*类型:* ${payload.formType}` },
    { type: "mrkdwn", text: `*姓名:* ${payload.name}` },
    { type: "mrkdwn", text: `*邮箱:* ${payload.email}` },
    { type: "mrkdwn", text: `*时间:* ${payload.timestamp}` },
  ];

  const summaryFields = Object.entries(payload.summary).map(([key, value]) => ({
    type: "mrkdwn" as const,
    text: `*${key}:* ${value}`,
  }));

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "新表单提交通知",
        },
      },
      {
        type: "section",
        fields: [...baseFields, ...summaryFields],
      },
    ],
  };
}

// ─── 统一分发函数 ────────────────────────────────────────────────────────────────

/**
 * 根据目标平台格式化通知消息
 *
 * @param platform - 目标 Webhook 平台
 * @param payload - 统一通知载荷
 * @returns 平台特定的消息 JSON 对象
 */
export function formatMessage(platform: WebhookPlatform, payload: NotificationPayload): unknown {
  switch (platform) {
    case "wechat":
      return formatWeChatMessage(payload);
    case "feishu":
      return formatFeishuMessage(payload);
    case "slack":
      return formatSlackMessage(payload);
  }
}
