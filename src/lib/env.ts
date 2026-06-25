/**
 * 环境变量配置与启动时验证
 *
 * 职责：
 * - 在模块加载时验证所有必需的环境变量（Fail-Fast 策略）
 * - 缺少任何必需变量时立即抛出错误，阻止应用启动
 * - 导出类型安全的 env 对象供其他模块使用
 *
 * Requirements: 6.1, 5.1, 8.1, 7.5, 9.5, 6.2, 6.4, 7.1, 5.2
 */

import { z } from "zod";

// ─── 环境变量 Schema 定义 ────────────────────────────────────────────────────────

/** 支持的存储后端类型 */
const storageBackendValues = ["local", "s3"] as const;

/** 支持的 Webhook 平台类型 */
const webhookPlatformValues = ["wechat", "feishu", "slack"] as const;

/**
 * 使用 Zod v4 定义环境变量验证 schema
 * 必需变量必须存在且为非空字符串
 * 可选变量允许缺失，但提供时必须符合格式约束
 */
const envSchema = z.object({
  // PostgreSQL
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL 不能为空"),

  // Redis
  REDIS_HOST: z
    .string()
    .min(1, "REDIS_HOST 不能为空"),
  REDIS_PORT: z
    .string()
    .min(1, "REDIS_PORT 不能为空")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 65535, {
      message: "REDIS_PORT 必须为 1-65535 之间的有效端口号",
    }),

  // SMTP
  SMTP_HOST: z
    .string()
    .min(1, "SMTP_HOST 不能为空"),
  SMTP_PORT: z
    .string()
    .min(1, "SMTP_PORT 不能为空")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 65535, {
      message: "SMTP_PORT 必须为 1-65535 之间的有效端口号",
    }),
  SMTP_USER: z
    .string()
    .min(1, "SMTP_USER 不能为空"),
  SMTP_PASS: z
    .string()
    .min(1, "SMTP_PASS 不能为空"),
  SMTP_FROM: z
    .string()
    .min(1, "SMTP_FROM 不能为空"),

  // Email Recipients
  EMAIL_IR_TEAM: z
    .string()
    .min(1, "EMAIL_IR_TEAM 不能为空"),
  EMAIL_DEV_TEAM: z
    .string()
    .min(1, "EMAIL_DEV_TEAM 不能为空"),
  EMAIL_SUPPORT_TEAM: z
    .string()
    .min(1, "EMAIL_SUPPORT_TEAM 不能为空"),

  // File Storage
  UPLOAD_DIR: z
    .string()
    .min(1, "UPLOAD_DIR 不能为空"),

  // App
  CORS_ORIGIN: z
    .string()
    .min(1, "CORS_ORIGIN 不能为空"),

  // ─── Admin API ──────────────────────────────────────────────────────────────
  // API Key 认证密钥（可选 — 未配置时管理 API 返回 503）
  ADMIN_API_KEY: z
    .string()
    .min(1, "ADMIN_API_KEY 不能为空字符串")
    .optional(),

  // ─── Storage Backend ────────────────────────────────────────────────────────
  // 存储后端类型（可选 — 未配置或无效值时回退到 "local"）
  STORAGE_BACKEND: z
    .string()
    .optional(),

  // S3 兼容对象存储配置（当 STORAGE_BACKEND=s3 时使用）
  S3_ENDPOINT: z
    .string()
    .url("S3_ENDPOINT 必须为有效的 URL")
    .optional(),
  S3_BUCKET: z
    .string()
    .min(1, "S3_BUCKET 不能为空字符串")
    .optional(),
  S3_ACCESS_KEY: z
    .string()
    .min(1, "S3_ACCESS_KEY 不能为空字符串")
    .optional(),
  S3_SECRET_KEY: z
    .string()
    .min(1, "S3_SECRET_KEY 不能为空字符串")
    .optional(),
  S3_REGION: z
    .string()
    .min(1, "S3_REGION 不能为空字符串")
    .optional(),

  // ─── Webhook ────────────────────────────────────────────────────────────────
  // Webhook 通知 URL（可选 — 未配置时跳过 Webhook 通知）
  WEBHOOK_URL: z
    .string()
    .url("WEBHOOK_URL 必须为有效的 URL")
    .optional(),
  // Webhook 目标平台（可选 — 当 WEBHOOK_URL 已配置时指定通知平台）
  WEBHOOK_PLATFORM: z
    .enum(webhookPlatformValues, {
      message: `WEBHOOK_PLATFORM 必须为 ${webhookPlatformValues.join(", ")} 之一`,
    })
    .optional(),
}).refine(
  (data) => {
    // 当 STORAGE_BACKEND=s3 时，S3 相关变量必须全部配置
    if (data.STORAGE_BACKEND === "s3") {
      return !!(data.S3_ENDPOINT && data.S3_BUCKET && data.S3_ACCESS_KEY && data.S3_SECRET_KEY && data.S3_REGION);
    }
    return true;
  },
  {
    message: "当 STORAGE_BACKEND=s3 时，S3_ENDPOINT、S3_BUCKET、S3_ACCESS_KEY、S3_SECRET_KEY、S3_REGION 必须全部配置",
    path: ["STORAGE_BACKEND"],
  }
).refine(
  (data) => {
    // 当 WEBHOOK_URL 已配置时，WEBHOOK_PLATFORM 也必须配置
    if (data.WEBHOOK_URL && !data.WEBHOOK_PLATFORM) {
      return false;
    }
    return true;
  },
  {
    message: "当 WEBHOOK_URL 已配置时，WEBHOOK_PLATFORM 必须指定目标平台",
    path: ["WEBHOOK_PLATFORM"],
  }
);

// ─── 导出常量供其他模块引用 ─────────────────────────────────────────────────────

/** 支持的存储后端类型（导出供 storage adapter 使用） */
export type StorageBackendType = (typeof storageBackendValues)[number];
export { storageBackendValues };

/** 支持的 Webhook 平台类型（导出供 webhook service 使用） */
export type WebhookPlatformType = (typeof webhookPlatformValues)[number];
export { webhookPlatformValues };

// ─── 环境变量验证与导出 ──────────────────────────────────────────────────────────

/** 已验证的环境变量类型 */
export type Env = z.infer<typeof envSchema>;

/**
 * 验证环境变量
 * 如果任何必需变量缺失或无效，返回错误信息数组
 */
function validateEnv(): { success: true; data: Env } | { success: false; errors: string[] } {
  const result = envSchema.safeParse(process.env);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
  );

  return { success: false, errors };
}

/**
 * 延迟验证的环境配置对象（Lazy Validation）
 *
 * 首次访问 env 属性时执行验证（而非模块加载时）。
 * 解决 Next.js 构建时环境变量不可用导致构建失败的问题。
 * 运行时首次调用 API route 时仍然 Fail-Fast。
 */
let _cachedEnv: Env | null = null;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!_cachedEnv) {
      const validation = validateEnv();
      if (!validation.success) {
        const errorMessage = [
          "❌ 环境变量验证失败，应用无法启动。",
          "缺少或无效的环境变量：",
          ...validation.errors,
          "",
          "请参考 .env.example 配置所有必需的环境变量。",
        ].join("\n");
        throw new Error(errorMessage);
      }
      _cachedEnv = Object.freeze(validation.data);
    }
    return _cachedEnv[prop as keyof Env];
  },
});
