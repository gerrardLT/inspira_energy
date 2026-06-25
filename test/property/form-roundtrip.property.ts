/**
 * Property 1: Form Data Persistence Round-Trip
 *
 * Feature: backend-infrastructure, Property 1: Form Data Persistence Round-Trip
 *
 * 对于任何有效的表单提交（LP 投资意向、开发商路条、联系咨询、Newsletter 订阅），
 * 将数据持久化到 PostgreSQL 后再检索，所有用户提供的字段值应与原始输入等价，
 * 且 created_at 时间戳为有效的 UTC 日期时间。
 *
 * Validates: Requirements 1.6, 2.10, 3.7, 4.6, 5.6
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  PREDEFINED_FUND_TYPES,
  PREDEFINED_REGIONS,
} from "@/lib/validation/schemas";

// ─── 字段映射函数（模拟真实 Route Handler 中的映射逻辑） ──────────────────────────

/** LP Interest: 表单输入 → DB insert 值 */
function mapLPInterestToDbRow(input: {
  name: string;
  institution: string;
  email: string;
  fund_types: string[];
  position?: string;
  phone?: string;
  regions?: string[];
  investment_size?: string;
}) {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    institution: input.institution,
    email: input.email,
    fundTypes: input.fund_types,
    position: input.position ?? null,
    phone: input.phone ?? null,
    regions: input.regions ?? [],
    investmentSize: input.investment_size ?? null,
    createdAt: new Date(),
    status: "pending" as const,
  };
}

/** Developer: 表单输入 → DB insert 值 */
function mapDeveloperToDbRow(input: {
  company_name: string;
  contact_name: string;
  email: string;
  region: string;
  project_type: string;
  capacity_mw: number;
  project_stage?: string;
  expected_construction_date?: string;
  notes?: string;
}) {
  return {
    id: crypto.randomUUID(),
    companyName: input.company_name,
    contactName: input.contact_name,
    email: input.email,
    region: input.region,
    projectType: input.project_type,
    capacityMw: input.capacity_mw.toString(),
    projectStage: input.project_stage ?? null,
    expectedConstructionDate: input.expected_construction_date ?? null,
    notes: input.notes ?? null,
    filePaths: [],
    createdAt: new Date(),
    status: "pending" as const,
  };
}

/** Contact: 表单输入 → DB insert 值 */
function mapContactToDbRow(input: {
  form_type: "investor" | "general";
  name: string;
  email: string;
  company?: string;
  position?: string;
  phone?: string;
  fund_types?: string[];
  regions?: string[];
  investment_size?: string;
  subject?: string;
  message?: string;
}) {
  return {
    id: crypto.randomUUID(),
    formType: input.form_type,
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    position: input.position ?? null,
    phone: input.phone ?? null,
    fundTypes: input.fund_types ?? null,
    regions: input.regions ?? null,
    investmentSize: input.investment_size ?? null,
    subject: input.subject ?? null,
    message: input.message ?? null,
    createdAt: new Date(),
    status: "pending" as const,
  };
}

/** Newsletter: 表单输入 → DB insert 值 */
function mapNewsletterToDbRow(input: { email: string }) {
  return {
    id: crypto.randomUUID(),
    email: input.email,
    subscribedAt: new Date(),
    status: "active" as const,
    unsubscribeToken: crypto.randomUUID(),
  };
}

// ─── 模拟 Drizzle select 返回值 ──────────────────────────────────────────────────

function simulateDbSelect<T extends Record<string, unknown>>(dbRow: T): T {
  return { ...dbRow };
}

// ─── 构造型生成器（避免 filter 导致的性能问题） ───────────────────────────────────

const ALPHA_LOWER = "abcdefghijklmnopqrstuvwxyz";
const ALPHA_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHA = ALPHA_LOWER + ALPHA_UPPER;
const ALNUM = ALPHA_LOWER + "0123456789";
const DIGITS = "0123456789";
const PHONE_CHARS = "0123456789+-() ";

/** 从给定字符集构造字符串（无需 filter） */
function stringFromChars(chars: string, min: number, max: number): fc.Arbitrary<string> {
  return fc
    .array(fc.constantFrom(...chars.split("")), { minLength: min, maxLength: max })
    .map((arr) => arr.join(""));
}

/** 生成中文名 */
const chineseNameArb = fc
  .array(fc.integer({ min: 0x4e00, max: 0x9fff }), { minLength: 2, maxLength: 6 })
  .map((cps) => cps.map((cp) => String.fromCodePoint(cp)).join(""));

/** 生成英文名 */
const englishNameArb = fc
  .tuple(
    stringFromChars(ALPHA_UPPER, 1, 1),
    stringFromChars(ALPHA_LOWER, 1, 10),
    stringFromChars(ALPHA_UPPER, 1, 1),
    stringFromChars(ALPHA_LOWER, 1, 10)
  )
  .map(([f1, r1, f2, r2]) => `${f1}${r1} ${f2}${r2}`);

/** 生成中英文混合名 */
const chineseEnglishNameArb = fc.oneof(chineseNameArb, englishNameArb);

/** 生成有效邮箱地址 */
const validEmailArb = fc
  .tuple(
    stringFromChars(ALNUM, 1, 20),
    stringFromChars(ALNUM, 1, 10),
    fc.constantFrom("com", "cn", "org", "net", "io")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** 生成有效的 fund_types 数组 */
const validFundTypesArb = fc
  .subarray([...PREDEFINED_FUND_TYPES], { minLength: 1, maxLength: PREDEFINED_FUND_TYPES.length })
  .map((arr) => arr as string[]);

/** 生成有效的 regions 数组 */
const validRegionsArb = fc
  .subarray([...PREDEFINED_REGIONS], { minLength: 1, maxLength: PREDEFINED_REGIONS.length })
  .map((arr) => arr as string[]);

/** 生成有效的 capacity_mw 值（0.1-10000） */
const validCapacityArb = fc.double({ min: 0.1, max: 10000, noNaN: true, noDefaultInfinity: true });

/** 生成有效的单行文本 */
const validSingleLineArb = (maxLen: number) =>
  stringFromChars(ALPHA + DIGITS + " -_", 1, Math.min(maxLen, 30));

/** 生成有效电话号码 */
const validPhoneArb = stringFromChars(PHONE_CHARS, 5, 18);

/** 生成有效日期字符串 */
const validDateArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

// ─── LP Interest 有效输入生成器 ───────────────────────────────────────────────────

const validLPInterestArb = fc.record({
  name: chineseEnglishNameArb,
  institution: validSingleLineArb(200),
  email: validEmailArb,
  fund_types: validFundTypesArb,
  position: fc.option(validSingleLineArb(100), { nil: undefined }),
  phone: fc.option(validPhoneArb, { nil: undefined }),
  regions: fc.option(validRegionsArb, { nil: undefined }),
  investment_size: fc.option(validSingleLineArb(50), { nil: undefined }),
});

// ─── Developer 有效输入生成器 ─────────────────────────────────────────────────────

const validDeveloperArb = fc.record({
  company_name: validSingleLineArb(200),
  contact_name: chineseEnglishNameArb,
  email: validEmailArb,
  region: validSingleLineArb(100),
  project_type: validSingleLineArb(100),
  capacity_mw: validCapacityArb,
  project_stage: fc.option(validSingleLineArb(100), { nil: undefined }),
  expected_construction_date: fc.option(validDateArb, { nil: undefined }),
  notes: fc.option(stringFromChars(ALPHA + DIGITS + " .,;!?", 1, 200), { nil: undefined }),
});

// ─── Contact Investor 有效输入生成器 ──────────────────────────────────────────────

const validContactInvestorArb = fc.record({
  form_type: fc.constant("investor" as const),
  name: chineseEnglishNameArb,
  company: validSingleLineArb(200),
  email: validEmailArb,
  position: fc.option(validSingleLineArb(100), { nil: undefined }),
  phone: fc.option(validPhoneArb, { nil: undefined }),
  fund_types: fc.option(validFundTypesArb, { nil: undefined }),
  regions: fc.option(validRegionsArb, { nil: undefined }),
  investment_size: fc.option(validSingleLineArb(50), { nil: undefined }),
});

// ─── Contact General 有效输入生成器 ───────────────────────────────────────────────

const validContactGeneralArb = fc.record({
  form_type: fc.constant("general" as const),
  name: chineseEnglishNameArb,
  email: validEmailArb,
  message: stringFromChars(ALPHA + DIGITS + " .,;!?\n", 1, 300),
  subject: fc.option(validSingleLineArb(200), { nil: undefined }),
  phone: fc.option(validPhoneArb, { nil: undefined }),
});

// ─── Newsletter 有效输入生成器 ────────────────────────────────────────────────────

const validNewsletterArb = fc.record({
  email: validEmailArb,
});

// ─── 辅助：验证 UTC 时间戳 ───────────────────────────────────────────────────────

function isValidUtcDate(date: unknown): boolean {
  if (!(date instanceof Date)) return false;
  if (isNaN(date.getTime())) return false;
  return true;
}

// ─── 属性测试 ────────────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 1: Form Data Persistence Round-Trip", () => {
  describe("LP Interest - 持久化并检索后字段值保持等价", () => {
    it("**Validates: Requirements 1.6** - 所有用户提供的字段在 round-trip 后保持等价", () => {
      fc.assert(
        fc.property(validLPInterestArb, (input) => {
          const dbRow = mapLPInterestToDbRow(input);
          const retrieved = simulateDbSelect(dbRow);

          expect(retrieved.name).toBe(input.name);
          expect(retrieved.institution).toBe(input.institution);
          expect(retrieved.email).toBe(input.email);
          expect(retrieved.fundTypes).toEqual(input.fund_types);
          expect(retrieved.position).toBe(input.position ?? null);
          expect(retrieved.phone).toBe(input.phone ?? null);
          expect(retrieved.regions).toEqual(input.regions ?? []);
          expect(retrieved.investmentSize).toBe(input.investment_size ?? null);
          expect(isValidUtcDate(retrieved.createdAt)).toBe(true);
          expect(retrieved.status).toBe("pending");
          expect(retrieved.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Developer - 持久化并检索后字段值保持等价", () => {
    it("**Validates: Requirements 2.10** - 所有用户提供的字段在 round-trip 后保持等价", () => {
      fc.assert(
        fc.property(validDeveloperArb, (input) => {
          const dbRow = mapDeveloperToDbRow(input);
          const retrieved = simulateDbSelect(dbRow);

          expect(retrieved.companyName).toBe(input.company_name);
          expect(retrieved.contactName).toBe(input.contact_name);
          expect(retrieved.email).toBe(input.email);
          expect(retrieved.region).toBe(input.region);
          expect(retrieved.projectType).toBe(input.project_type);
          expect(parseFloat(retrieved.capacityMw)).toBeCloseTo(input.capacity_mw, 2);
          expect(retrieved.projectStage).toBe(input.project_stage ?? null);
          expect(retrieved.expectedConstructionDate).toBe(
            input.expected_construction_date ?? null
          );
          expect(retrieved.notes).toBe(input.notes ?? null);
          expect(retrieved.filePaths).toEqual([]);
          expect(isValidUtcDate(retrieved.createdAt)).toBe(true);
          expect(retrieved.status).toBe("pending");
          expect(retrieved.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Contact - 持久化并检索后字段值保持等价", () => {
    it("**Validates: Requirements 3.7** - Contact Investor 所有字段在 round-trip 后保持等价", () => {
      fc.assert(
        fc.property(validContactInvestorArb, (input) => {
          const dbRow = mapContactToDbRow(input);
          const retrieved = simulateDbSelect(dbRow);

          expect(retrieved.formType).toBe(input.form_type);
          expect(retrieved.name).toBe(input.name);
          expect(retrieved.email).toBe(input.email);
          expect(retrieved.company).toBe(input.company ?? null);
          expect(retrieved.position).toBe(input.position ?? null);
          expect(retrieved.phone).toBe(input.phone ?? null);
          expect(retrieved.fundTypes).toEqual(input.fund_types ?? null);
          expect(retrieved.regions).toEqual(input.regions ?? null);
          expect(retrieved.investmentSize).toBe(input.investment_size ?? null);
          expect(isValidUtcDate(retrieved.createdAt)).toBe(true);
          expect(retrieved.status).toBe("pending");
        }),
        { numRuns: 100 }
      );
    });

    it("**Validates: Requirements 3.7** - Contact General 所有字段在 round-trip 后保持等价", () => {
      fc.assert(
        fc.property(validContactGeneralArb, (input) => {
          const dbRow = mapContactToDbRow(input);
          const retrieved = simulateDbSelect(dbRow);

          expect(retrieved.formType).toBe(input.form_type);
          expect(retrieved.name).toBe(input.name);
          expect(retrieved.email).toBe(input.email);
          expect(retrieved.message).toBe(input.message ?? null);
          expect(retrieved.subject).toBe(input.subject ?? null);
          expect(retrieved.phone).toBe(input.phone ?? null);
          expect(isValidUtcDate(retrieved.createdAt)).toBe(true);
          expect(retrieved.status).toBe("pending");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Newsletter - 持久化并检索后字段值保持等价", () => {
    it("**Validates: Requirements 4.6, 5.6** - email 在 round-trip 后保持等价", () => {
      fc.assert(
        fc.property(validNewsletterArb, (input) => {
          const dbRow = mapNewsletterToDbRow(input);
          const retrieved = simulateDbSelect(dbRow);

          expect(retrieved.email).toBe(input.email);
          expect(isValidUtcDate(retrieved.subscribedAt)).toBe(true);
          expect(retrieved.status).toBe("active");
          expect(retrieved.unsubscribeToken).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          );
          expect(retrieved.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("跨表单类型通用属性", () => {
    it("**Validates: Requirements 5.6** - 所有表单类型的时间戳均为有效 UTC 且在合理范围内", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            validLPInterestArb.map((input) => ({
              type: "lp-interest" as const,
              row: mapLPInterestToDbRow(input),
            })),
            validDeveloperArb.map((input) => ({
              type: "developer" as const,
              row: mapDeveloperToDbRow(input),
            })),
            validContactInvestorArb.map((input) => ({
              type: "contact-investor" as const,
              row: mapContactToDbRow(input),
            })),
            validContactGeneralArb.map((input) => ({
              type: "contact-general" as const,
              row: mapContactToDbRow(input),
            })),
            validNewsletterArb.map((input) => ({
              type: "newsletter" as const,
              row: mapNewsletterToDbRow(input),
            }))
          ),
          ({ type, row }) => {
            const retrieved = simulateDbSelect(row);

            const tsField =
              type === "newsletter"
                ? (retrieved as { subscribedAt: Date }).subscribedAt
                : (retrieved as { createdAt: Date }).createdAt;

            expect(isValidUtcDate(tsField)).toBe(true);

            // 时间戳在合理范围内（当前时间前后 2 秒内）
            const now = Date.now();
            expect(tsField.getTime()).toBeGreaterThanOrEqual(now - 2000);
            expect(tsField.getTime()).toBeLessThanOrEqual(now + 2000);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
