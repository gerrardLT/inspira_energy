/**
 * Drizzle ORM Schema 定义
 * 定义所有数据库表结构和枚举类型
 *
 * 表：
 * - lp_interest_submissions: LP 投资意向提交
 * - developer_submissions: 开发商路条提交
 * - contact_submissions: 联系咨询提交
 * - newsletter_subscriptions: Newsletter 订阅
 */

import {
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── 枚举定义 ───────────────────────────────────────────────────────────────────

/** 表单提交状态枚举：pending(待处理) → contacted(已联系) → closed(已关闭) */
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "contacted",
  "closed",
]);

/** Newsletter 订阅状态枚举：active(活跃) / unsubscribed(已退订) */
export const newsletterStatusEnum = pgEnum("newsletter_status", [
  "active",
  "unsubscribed",
]);

/** 联系表单类型枚举：investor(投资者咨询) / general(通用咨询) */
export const contactFormTypeEnum = pgEnum("contact_form_type", [
  "investor",
  "general",
]);

// ─── LP 投资意向表 ──────────────────────────────────────────────────────────────

/**
 * LP 投资意向提交表
 * 收集机构投资者的投资意向信息
 */
export const lpInterestSubmissions = pgTable("lp_interest_submissions", {
  /** 主键，自动生成 UUID */
  id: uuid("id").defaultRandom().primaryKey(),
  /** 姓名（必填，最长 100 字符） */
  name: varchar("name", { length: 100 }).notNull(),
  /** 机构名称（必填，最长 200 字符） */
  institution: varchar("institution", { length: 200 }).notNull(),
  /** 职位（可选，最长 100 字符） */
  position: varchar("position", { length: 100 }),
  /** 邮箱地址（必填，最长 254 字符，RFC 5322 格式） */
  email: varchar("email", { length: 254 }).notNull(),
  /** 电话号码（可选，最长 20 字符） */
  phone: varchar("phone", { length: 20 }),
  /** 基金类型（必填，JSONB 数组，预定义列表中的一个或多个值） */
  fundTypes: jsonb("fund_types").notNull(),
  /** 投资区域（可选，JSONB 数组，默认空数组） */
  regions: jsonb("regions").default([]),
  /** 投资规模（可选，最长 50 字符） */
  investmentSize: varchar("investment_size", { length: 50 }),
  /** 创建时间（自动生成 UTC 时间戳） */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** 状态更新时间（UTC 时间戳，状态变更时写入） */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  /** 提交状态（枚举，默认 pending） */
  status: submissionStatusEnum("status").default("pending").notNull(),
});

// ─── 开发商路条提交表 ────────────────────────────────────────────────────────────

/**
 * 开发商路条提交表
 * 收集新能源项目开发商的项目信息和相关文件
 */
export const developerSubmissions = pgTable("developer_submissions", {
  /** 主键，自动生成 UUID */
  id: uuid("id").defaultRandom().primaryKey(),
  /** 公司名称（必填，最长 200 字符） */
  companyName: varchar("company_name", { length: 200 }).notNull(),
  /** 联系人姓名（必填，最长 100 字符） */
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  /** 邮箱地址（必填，最长 254 字符） */
  email: varchar("email", { length: 254 }).notNull(),
  /** 项目所在区域（必填，最长 100 字符） */
  region: varchar("region", { length: 100 }).notNull(),
  /** 项目类型（必填，最长 100 字符） */
  projectType: varchar("project_type", { length: 100 }).notNull(),
  /** 装机容量 MW（必填，精度 8 位，小数 2 位，范围 0.1-10000） */
  capacityMw: numeric("capacity_mw", { precision: 8, scale: 2 }).notNull(),
  /** 项目阶段（可选，最长 100 字符） */
  projectStage: varchar("project_stage", { length: 100 }),
  /** 预计开工日期（可选，最长 20 字符） */
  expectedConstructionDate: varchar("expected_construction_date", {
    length: 20,
  }),
  /** 备注信息（可选，文本字段） */
  notes: text("notes"),
  /** 上传文件路径（JSONB 数组，StoredFile[]，默认空数组） */
  filePaths: jsonb("file_paths").default([]),
  /** 创建时间（自动生成 UTC 时间戳） */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** 状态更新时间（UTC 时间戳，状态变更时写入） */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  /** 提交状态（枚举，默认 pending） */
  status: submissionStatusEnum("status").default("pending").notNull(),
});

// ─── 联系咨询表 ─────────────────────────────────────────────────────────────────

/**
 * 联系咨询提交表
 * 包含投资者咨询和通用咨询两种模式
 */
export const contactSubmissions = pgTable("contact_submissions", {
  /** 主键，自动生成 UUID */
  id: uuid("id").defaultRandom().primaryKey(),
  /** 表单类型：investor(投资者) / general(通用)（必填） */
  formType: contactFormTypeEnum("form_type").notNull(),
  /** 姓名（必填，最长 100 字符） */
  name: varchar("name", { length: 100 }).notNull(),
  /** 公司名称（可选，最长 200 字符） */
  company: varchar("company", { length: 200 }),
  /** 职位（可选，最长 100 字符） */
  position: varchar("position", { length: 100 }),
  /** 邮箱地址（必填，最长 254 字符） */
  email: varchar("email", { length: 254 }).notNull(),
  /** 电话号码（可选，最长 20 字符） */
  phone: varchar("phone", { length: 20 }),
  /** 基金类型（可选，JSONB 数组） */
  fundTypes: jsonb("fund_types"),
  /** 投资区域（可选，JSONB 数组） */
  regions: jsonb("regions"),
  /** 投资规模（可选，最长 50 字符） */
  investmentSize: varchar("investment_size", { length: 50 }),
  /** 主题（可选，最长 200 字符） */
  subject: varchar("subject", { length: 200 }),
  /** 消息内容（可选，文本字段，最大 5000 字符由验证层控制） */
  message: text("message"),
  /** 创建时间（自动生成 UTC 时间戳） */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** 状态更新时间（UTC 时间戳，状态变更时写入） */
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  /** 提交状态（枚举，默认 pending） */
  status: submissionStatusEnum("status").default("pending").notNull(),
});

// ─── Newsletter 订阅表 ──────────────────────────────────────────────────────────

/**
 * Newsletter 订阅表
 * 管理邮件订阅者及退订 token
 */
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  /** 主键，自动生成 UUID */
  id: uuid("id").defaultRandom().primaryKey(),
  /** 邮箱地址（必填，最长 254 字符，唯一约束） */
  email: varchar("email", { length: 254 }).notNull().unique(),
  /** 订阅时间（自动生成 UTC 时间戳） */
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** 订阅状态（枚举，默认 active） */
  status: newsletterStatusEnum("status").default("active").notNull(),
  /** 退订 token（自动生成 UUID，唯一约束，用于一键退订） */
  unsubscribeToken: uuid("unsubscribe_token")
    .defaultRandom()
    .notNull()
    .unique(),
});
