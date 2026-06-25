/**
 * Zod v4 验证 Schema 定义
 *
 * 定义所有表单类型的输入验证规则：
 * - LP 投资意向表单
 * - 开发商路条提交表单
 * - 联系咨询表单（投资者 / 通用）
 * - Newsletter 订阅表单
 *
 * 验证规则：
 * - 单行字段最大 1000 字符
 * - 多行字段最大 5000 字符
 * - 邮箱 RFC 5322 格式，最大 254 字符
 * - 错误消息使用中文
 */

import { z } from "zod";
import { FIELD_LENGTH_LIMITS } from "@/types/api";

// ─── 预定义常量 ───────────────────────────────────────────────────────────────────

/** 预定义基金类型列表 */
export const PREDEFINED_FUND_TYPES = [
  "solar",
  "wind",
  "hydro",
  "biomass",
  "energy_storage",
  "hydrogen",
  "mixed",
] as const;

/** 预定义投资区域列表 */
export const PREDEFINED_REGIONS = [
  "east_china",
  "south_china",
  "north_china",
  "central_china",
  "northwest_china",
  "southwest_china",
  "northeast_china",
  "southeast_asia",
  "other",
] as const;

export type FundType = (typeof PREDEFINED_FUND_TYPES)[number];
export type Region = (typeof PREDEFINED_REGIONS)[number];

// ─── 基础验证工具 ─────────────────────────────────────────────────────────────────

/** 单行文本字段验证（最大 1000 字符，不允许换行） */
const singleLineString = (fieldName: string, maxLength: number) =>
  z
    .string()
    .min(1, { message: `${fieldName}为必填项` })
    .max(maxLength, {
      message: `${fieldName}不能超过${maxLength}个字符`,
    })
    .refine((val) => !val.includes("\n") && !val.includes("\r"), {
      message: `${fieldName}不允许包含换行符`,
    });

/** 可选单行文本字段验证 */
const optionalSingleLineString = (fieldName: string, maxLength: number) =>
  z
    .string()
    .max(maxLength, {
      message: `${fieldName}不能超过${maxLength}个字符`,
    })
    .refine((val) => !val.includes("\n") && !val.includes("\r"), {
      message: `${fieldName}不允许包含换行符`,
    })
    .optional();

/** 多行文本字段验证（最大 5000 字符） */
const multiLineString = (fieldName: string, maxLength: number) =>
  z
    .string()
    .min(1, { message: `${fieldName}为必填项` })
    .max(maxLength, {
      message: `${fieldName}不能超过${maxLength}个字符`,
    });

/** 邮箱验证：RFC 5322 格式，最大 254 字符 */
const emailField = z
  .string()
  .min(1, { message: "邮箱为必填项" })
  .max(FIELD_LENGTH_LIMITS.email, {
    message: `邮箱不能超过${FIELD_LENGTH_LIMITS.email}个字符`,
  })
  .email({ message: "邮箱格式不正确" });

// ─── LP 投资意向表单 Schema ───────────────────────────────────────────────────────

export const lpInterestSchema = z.object({
  /** 姓名（必填，最大 100 字符，单行） */
  name: singleLineString("姓名", FIELD_LENGTH_LIMITS.name),
  /** 机构名称（必填，最大 200 字符，单行） */
  institution: singleLineString("机构名称", FIELD_LENGTH_LIMITS.institution),
  /** 邮箱（必填，RFC 5322 格式，最大 254 字符） */
  email: emailField,
  /** 基金类型（必填，至少选择一项，必须在预定义列表中） */
  fund_types: z
    .array(z.enum(PREDEFINED_FUND_TYPES, { message: "基金类型不在允许的选项列表中" }))
    .min(1, { message: "至少选择一种基金类型" }),
  /** 职位（可选，最大 100 字符，单行） */
  position: optionalSingleLineString("职位", FIELD_LENGTH_LIMITS.position),
  /** 电话（可选，最大 20 字符，单行） */
  phone: optionalSingleLineString("电话", FIELD_LENGTH_LIMITS.phone),
  /** 投资区域（可选，预定义列表中的值） */
  regions: z
    .array(z.enum(PREDEFINED_REGIONS, { message: "投资区域不在允许的选项列表中" }))
    .optional(),
  /** 投资规模（可选，最大 50 字符，单行） */
  investment_size: optionalSingleLineString(
    "投资规模",
    FIELD_LENGTH_LIMITS.investmentSize
  ),
});

/** LP 投资意向表单输入类型 */
export type LPInterestInput = z.infer<typeof lpInterestSchema>;

// ─── 开发商路条提交表单 Schema ────────────────────────────────────────────────────

export const developerSchema = z.object({
  /** 公司名称（必填，最大 200 字符，单行） */
  company_name: singleLineString("公司名称", FIELD_LENGTH_LIMITS.company),
  /** 联系人姓名（必填，最大 100 字符，单行） */
  contact_name: singleLineString("联系人姓名", FIELD_LENGTH_LIMITS.name),
  /** 邮箱（必填，RFC 5322 格式，最大 254 字符） */
  email: emailField,
  /** 项目区域（必填，最大 100 字符，单行） */
  region: singleLineString("项目区域", FIELD_LENGTH_LIMITS.singleLine).pipe(
    z.string().max(100, { message: "项目区域不能超过100个字符" })
  ),
  /** 项目类型（必填，最大 100 字符，单行） */
  project_type: singleLineString("项目类型", FIELD_LENGTH_LIMITS.singleLine).pipe(
    z.string().max(100, { message: "项目类型不能超过100个字符" })
  ),
  /** 装机容量 MW（必填，数值 0.1-10000） */
  capacity_mw: z.coerce
    .number({ message: "装机容量必须为数字" })
    .min(0.1, { message: "装机容量不能小于0.1 MW" })
    .max(10000, { message: "装机容量不能超过10000 MW" }),
  /** 项目阶段（可选，最大 100 字符，单行） */
  project_stage: optionalSingleLineString("项目阶段", 100),
  /** 预计开工日期（可选，最大 20 字符，单行） */
  expected_construction_date: optionalSingleLineString("预计开工日期", 20),
  /** 备注（可选，多行，最大 5000 字符） */
  notes: z
    .string()
    .max(FIELD_LENGTH_LIMITS.message, {
      message: `备注不能超过${FIELD_LENGTH_LIMITS.message}个字符`,
    })
    .optional(),
});

/** 开发商路条提交表单输入类型 */
export type DeveloperInput = z.infer<typeof developerSchema>;

// ─── 联系咨询表单 Schema（投资者模式） ──────────────────────────────────────────────

export const contactInvestorSchema = z.object({
  /** 表单类型标识 */
  form_type: z.literal("investor"),
  /** 姓名（必填，最大 100 字符，单行） */
  name: singleLineString("姓名", FIELD_LENGTH_LIMITS.name),
  /** 公司名称（必填，最大 200 字符，单行） */
  company: singleLineString("公司名称", FIELD_LENGTH_LIMITS.company),
  /** 邮箱（必填，RFC 5322 格式，最大 254 字符） */
  email: emailField,
  /** 职位（可选，最大 100 字符，单行） */
  position: optionalSingleLineString("职位", FIELD_LENGTH_LIMITS.position),
  /** 电话（可选，最大 20 字符，单行） */
  phone: optionalSingleLineString("电话", FIELD_LENGTH_LIMITS.phone),
  /** 基金类型（可选） */
  fund_types: z
    .array(z.enum(PREDEFINED_FUND_TYPES, { message: "基金类型不在允许的选项列表中" }))
    .optional(),
  /** 投资区域（可选） */
  regions: z
    .array(z.enum(PREDEFINED_REGIONS, { message: "投资区域不在允许的选项列表中" }))
    .optional(),
  /** 投资规模（可选，最大 50 字符） */
  investment_size: optionalSingleLineString(
    "投资规模",
    FIELD_LENGTH_LIMITS.investmentSize
  ),
});

/** 联系咨询表单输入类型（投资者） */
export type ContactInvestorInput = z.infer<typeof contactInvestorSchema>;

// ─── 联系咨询表单 Schema（通用模式） ────────────────────────────────────────────────

export const contactGeneralSchema = z.object({
  /** 表单类型标识 */
  form_type: z.literal("general"),
  /** 姓名（必填，最大 100 字符，单行） */
  name: singleLineString("姓名", FIELD_LENGTH_LIMITS.name),
  /** 邮箱（必填，RFC 5322 格式，最大 254 字符） */
  email: emailField,
  /** 消息内容（必填，多行，最大 5000 字符） */
  message: multiLineString("消息内容", FIELD_LENGTH_LIMITS.message),
  /** 主题（可选，最大 200 字符，单行） */
  subject: optionalSingleLineString("主题", 200),
  /** 电话（可选，最大 20 字符，单行） */
  phone: optionalSingleLineString("电话", FIELD_LENGTH_LIMITS.phone),
});

/** 联系咨询表单输入类型（通用） */
export type ContactGeneralInput = z.infer<typeof contactGeneralSchema>;

// ─── 联系表单联合 Schema ──────────────────────────────────────────────────────────

/** 联系表单验证（根据 form_type 字段选择对应 schema） */
export const contactSchema = z.discriminatedUnion("form_type", [
  contactInvestorSchema,
  contactGeneralSchema,
]);

/** 联系咨询表单输入类型（联合） */
export type ContactInput = z.infer<typeof contactSchema>;

// ─── Newsletter 订阅表单 Schema ───────────────────────────────────────────────────

export const newsletterSchema = z.object({
  /** 邮箱（必填，RFC 5322 格式，最大 254 字符） */
  email: emailField,
});

/** Newsletter 订阅表单输入类型 */
export type NewsletterInput = z.infer<typeof newsletterSchema>;
