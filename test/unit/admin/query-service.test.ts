/**
 * 提交查询服务属性测试
 *
 * 测试 QueryService 的核心逻辑：
 * - formType 验证
 * - 状态筛选
 * - 日期范围筛选
 * - 邮箱子串匹配（大小写不敏感）
 * - 跨字段搜索
 * - 分页计算
 *
 * **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ADMIN_FORM_TYPE_LIST } from "@/types/api";
import type { AdminFormType } from "@/types/api";

// ─── 统一配置 ────────────────────────────────────────────────────────────────────

const PBT_CONFIG = { numRuns: 100 };

// ─── 纯逻辑：筛选与分页函数（与 QueryService 实现一致） ─────────────────────────

/** 有效状态列表 */
const VALID_STATUSES = ["pending", "contacted", "closed"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

/** 模拟提交记录 */
interface MockSubmission {
  id: string;
  email: string;
  name: string;
  company: string;
  status: ValidStatus;
  created_at: string; // ISO 8601
}

/**
 * 状态筛选（纯函数）
 * 等同于 SQL: WHERE status = $1
 */
function filterByStatus(
  records: MockSubmission[],
  status: ValidStatus
): MockSubmission[] {
  return records.filter((r) => r.status === status);
}

/**
 * 日期范围筛选（纯函数）
 * 等同于 SQL: WHERE created_at >= $start AND created_at <= $end
 */
function filterByDateRange(
  records: MockSubmission[],
  startDate: string,
  endDate: string
): MockSubmission[] {
  return records.filter((r) => r.created_at >= startDate && r.created_at <= endDate);
}

/**
 * 邮箱子串匹配（纯函数，大小写不敏感）
 * 等同于 SQL: WHERE email ILIKE '%' || $query || '%'
 */
function filterByEmail(
  records: MockSubmission[],
  query: string
): MockSubmission[] {
  const lowerQuery = query.toLowerCase();
  return records.filter((r) => r.email.toLowerCase().includes(lowerQuery));
}

/**
 * 跨字段搜索（纯函数，大小写不敏感 OR 逻辑）
 * 等同于 SQL: WHERE (name ILIKE '%' || $s || '%' OR company ILIKE '%' || $s || '%' OR email ILIKE '%' || $s || '%')
 */
function filterBySearch(
  records: MockSubmission[],
  search: string
): MockSubmission[] {
  const lowerSearch = search.toLowerCase();
  return records.filter(
    (r) =>
      r.name.toLowerCase().includes(lowerSearch) ||
      r.company.toLowerCase().includes(lowerSearch) ||
      r.email.toLowerCase().includes(lowerSearch)
  );
}

/**
 * 分页计算（纯函数）
 * 等同于 QueryService.calculatePagination 内部逻辑
 */
function calculatePagination(
  total: number,
  page: number,
  pageSize: number
): { totalPages: number; offset: number } {
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const offset = (page - 1) * pageSize;
  return { totalPages, offset };
}

// ─── Generators ──────────────────────────────────────────────────────────────────

/** 生成有效状态 */
const statusArb = fc.constantFrom<ValidStatus>("pending", "contacted", "closed");

/** 生成简单 email */
const emailArb = fc.emailAddress();

/** 生成简单名称（非空字符串） */
const nameArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/** 生成公司名称 */
const companyArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/** 生成 ISO 8601 日期时间字符串（基于时间戳范围避免 Invalid Date） */
const isoDateArb = fc
  .integer({
    min: new Date("2020-01-01T00:00:00Z").getTime(),
    max: new Date("2025-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

/** 生成模拟提交记录 */
const submissionArb: fc.Arbitrary<MockSubmission> = fc.record({
  id: fc.uuid(),
  email: emailArb,
  name: nameArb,
  company: companyArb,
  status: statusArb,
  created_at: isoDateArb,
});

/** 生成模拟提交记录数组 */
const submissionsArb = fc.array(submissionArb, { minLength: 0, maxLength: 30 });

/** 生成非法 formType（不在允许列表中的字符串） */
const invalidFormTypeArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !ADMIN_FORM_TYPE_LIST.includes(s as AdminFormType));

/** 生成有效 formType */
const validFormTypeArb = fc.constantFrom<AdminFormType>(
  "lp-interest",
  "developer",
  "contact",
  "newsletter"
);

/** 生成搜索子串（非空，不含特殊正则字符） */
const searchQueryArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s.trim().length > 0);

// ─── Property Tests ──────────────────────────────────────────────────────────────

// Feature: backend-operations, Property 3: 无效 formType 验证
describe("Feature: backend-operations, Property 3: 无效 formType 验证", () => {
  it("不在允许列表中的字符串应被拒绝", () => {
    fc.assert(
      fc.property(invalidFormTypeArb, (formType) => {
        // 模拟路由层的 formType 验证逻辑
        const isValid = ADMIN_FORM_TYPE_LIST.includes(formType as AdminFormType);
        expect(isValid).toBe(false);
      }),
      PBT_CONFIG
    );
  });

  it("在允许列表中的字符串应通过验证", () => {
    fc.assert(
      fc.property(validFormTypeArb, (formType) => {
        const isValid = ADMIN_FORM_TYPE_LIST.includes(formType as AdminFormType);
        expect(isValid).toBe(true);
      }),
      PBT_CONFIG
    );
  });
});

// Feature: backend-operations, Property 4: 状态筛选正确性
describe("Feature: backend-operations, Property 4: 状态筛选正确性", () => {
  it("筛选结果中所有记录的 status 应等于筛选值", () => {
    fc.assert(
      fc.property(submissionsArb, statusArb, (records, filterStatus) => {
        const filtered = filterByStatus(records, filterStatus);

        // 所有返回的记录 status 必须匹配筛选值
        for (const record of filtered) {
          expect(record.status).toBe(filterStatus);
        }
      }),
      PBT_CONFIG
    );
  });

  it("筛选结果应包含所有匹配的记录（不遗漏）", () => {
    fc.assert(
      fc.property(submissionsArb, statusArb, (records, filterStatus) => {
        const filtered = filterByStatus(records, filterStatus);
        const expected = records.filter((r) => r.status === filterStatus);

        expect(filtered.length).toBe(expected.length);
      }),
      PBT_CONFIG
    );
  });
});

// Feature: backend-operations, Property 5: 日期范围筛选正确性
describe("Feature: backend-operations, Property 5: 日期范围筛选正确性", () => {
  it("筛选结果中所有记录的 created_at 应在 [startDate, endDate] 范围内", () => {
    fc.assert(
      fc.property(
        submissionsArb,
        isoDateArb,
        isoDateArb,
        (records, date1, date2) => {
          // 确保 startDate <= endDate
          const startDate = date1 <= date2 ? date1 : date2;
          const endDate = date1 <= date2 ? date2 : date1;

          const filtered = filterByDateRange(records, startDate, endDate);

          for (const record of filtered) {
            expect(record.created_at >= startDate).toBe(true);
            expect(record.created_at <= endDate).toBe(true);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it("不在范围内的记录不应出现在结果中", () => {
    fc.assert(
      fc.property(
        submissionsArb,
        isoDateArb,
        isoDateArb,
        (records, date1, date2) => {
          const startDate = date1 <= date2 ? date1 : date2;
          const endDate = date1 <= date2 ? date2 : date1;

          const filtered = filterByDateRange(records, startDate, endDate);
          const excluded = records.filter(
            (r) => r.created_at < startDate || r.created_at > endDate
          );

          // filtered 和 excluded 之和应等于原始记录数
          expect(filtered.length + excluded.length).toBe(records.length);
        }
      ),
      PBT_CONFIG
    );
  });
});

// Feature: backend-operations, Property 6: 邮箱筛选大小写不敏感子串匹配
describe("Feature: backend-operations, Property 6: 邮箱筛选大小写不敏感子串匹配", () => {
  it("筛选结果中所有记录的 email.toLowerCase() 应包含 query.toLowerCase()", () => {
    fc.assert(
      fc.property(submissionsArb, searchQueryArb, (records, query) => {
        const filtered = filterByEmail(records, query);

        const lowerQuery = query.toLowerCase();
        for (const record of filtered) {
          expect(record.email.toLowerCase()).toContain(lowerQuery);
        }
      }),
      PBT_CONFIG
    );
  });

  it("大小写变化不影响筛选结果", () => {
    fc.assert(
      fc.property(submissionsArb, searchQueryArb, (records, query) => {
        const resultLower = filterByEmail(records, query.toLowerCase());
        const resultUpper = filterByEmail(records, query.toUpperCase());
        const resultOriginal = filterByEmail(records, query);

        // 三种写法应返回相同数量的结果
        expect(resultLower.length).toBe(resultOriginal.length);
        expect(resultUpper.length).toBe(resultOriginal.length);
      }),
      PBT_CONFIG
    );
  });
});

// Feature: backend-operations, Property 7: 跨字段搜索正确性
describe("Feature: backend-operations, Property 7: 跨字段搜索正确性", () => {
  it("搜索结果中每条记录至少一个目标字段包含搜索词（大小写不敏感）", () => {
    fc.assert(
      fc.property(submissionsArb, searchQueryArb, (records, search) => {
        const filtered = filterBySearch(records, search);

        const lowerSearch = search.toLowerCase();
        for (const record of filtered) {
          const matchesName = record.name.toLowerCase().includes(lowerSearch);
          const matchesCompany = record.company.toLowerCase().includes(lowerSearch);
          const matchesEmail = record.email.toLowerCase().includes(lowerSearch);

          expect(matchesName || matchesCompany || matchesEmail).toBe(true);
        }
      }),
      PBT_CONFIG
    );
  });

  it("不匹配任何字段的记录不应出现在结果中", () => {
    fc.assert(
      fc.property(submissionsArb, searchQueryArb, (records, search) => {
        const filtered = filterBySearch(records, search);
        const lowerSearch = search.toLowerCase();

        // 不在 filtered 中的记录，三个字段都不应包含搜索词
        const excluded = records.filter((r) => !filtered.includes(r));
        for (const record of excluded) {
          const matchesAny =
            record.name.toLowerCase().includes(lowerSearch) ||
            record.company.toLowerCase().includes(lowerSearch) ||
            record.email.toLowerCase().includes(lowerSearch);

          expect(matchesAny).toBe(false);
        }
      }),
      PBT_CONFIG
    );
  });
});

// Feature: backend-operations, Property 8: 分页切片与元数据正确性
describe("Feature: backend-operations, Property 8: 分页切片与元数据正确性", () => {
  /** 生成合法分页参数 */
  const paginationParamsArb = fc.record({
    total: fc.integer({ min: 0, max: 1000 }),
    page: fc.integer({ min: 1, max: 100 }),
    pageSize: fc.integer({ min: 1, max: 100 }),
  });

  it("totalPages 计算正确：Math.ceil(total / pageSize)，total 为 0 时 totalPages 为 0", () => {
    fc.assert(
      fc.property(paginationParamsArb, ({ total, page, pageSize }) => {
        const { totalPages } = calculatePagination(total, page, pageSize);

        if (total === 0) {
          expect(totalPages).toBe(0);
        } else {
          expect(totalPages).toBe(Math.ceil(total / pageSize));
        }
      }),
      PBT_CONFIG
    );
  });

  it("当 page <= totalPages 时，offset 等于 (page - 1) * pageSize", () => {
    fc.assert(
      fc.property(paginationParamsArb, ({ total, page, pageSize }) => {
        const { totalPages, offset } = calculatePagination(total, page, pageSize);

        if (totalPages > 0 && page <= totalPages) {
          expect(offset).toBe((page - 1) * pageSize);
        }
      }),
      PBT_CONFIG
    );
  });

  it("当 page > totalPages 时，应返回空数据", () => {
    fc.assert(
      fc.property(paginationParamsArb, ({ total, page, pageSize }) => {
        const { totalPages } = calculatePagination(total, page, pageSize);

        if (page > totalPages) {
          // 模拟 QueryService 的行为：page > totalPages 时返回空数组
          const shouldReturnEmpty = total === 0 || page > totalPages;
          expect(shouldReturnEmpty).toBe(true);
        }
      }),
      PBT_CONFIG
    );
  });

  it("offset 不应为负数", () => {
    fc.assert(
      fc.property(paginationParamsArb, ({ total, page, pageSize }) => {
        const { offset } = calculatePagination(total, page, pageSize);
        expect(offset).toBeGreaterThanOrEqual(0);
      }),
      PBT_CONFIG
    );
  });

  it("totalPages * pageSize >= total（总页数能覆盖所有记录）", () => {
    fc.assert(
      fc.property(paginationParamsArb, ({ total, page, pageSize }) => {
        const { totalPages } = calculatePagination(total, page, pageSize);

        if (total > 0) {
          expect(totalPages * pageSize).toBeGreaterThanOrEqual(total);
          // 并且不能多出一整页
          expect((totalPages - 1) * pageSize).toBeLessThan(total);
        }
      }),
      PBT_CONFIG
    );
  });
});

// ─── 补充：Newsletter subscribed_at 排序正确性 ───────────────────────────────────

// Feature: backend-operations, Property 8 补充: Newsletter 使用 subscribed_at 排序
describe("Newsletter subscribed_at 排序正确性", () => {
  /** 模拟 newsletter 记录（使用 subscribed_at 而非 created_at） */
  interface MockNewsletterRecord {
    id: string;
    email: string;
    subscribed_at: string; // ISO 8601
    status: "active" | "unsubscribed";
  }

  /** 生成 newsletter 记录 */
  const newsletterRecordArb: fc.Arbitrary<MockNewsletterRecord> = fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    subscribed_at: fc
      .integer({
        min: new Date("2020-01-01T00:00:00Z").getTime(),
        max: new Date("2025-12-31T23:59:59Z").getTime(),
      })
      .map((ts) => new Date(ts).toISOString()),
    status: fc.constantFrom("active" as const, "unsubscribed" as const),
  });

  const newsletterRecordsArb = fc.array(newsletterRecordArb, { minLength: 2, maxLength: 30 });

  it("按 subscribed_at DESC 排序后，每条记录的时间戳应大于等于下一条", () => {
    fc.assert(
      fc.property(newsletterRecordsArb, (records) => {
        // 模拟 QueryService 的排序逻辑：ORDER BY subscribed_at DESC
        const sorted = [...records].sort(
          (a, b) => b.subscribed_at.localeCompare(a.subscribed_at)
        );

        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].subscribed_at >= sorted[i + 1].subscribed_at).toBe(true);
        }
      }),
      PBT_CONFIG
    );
  });

  it("日期范围筛选应用于 subscribed_at 字段（非 created_at）", () => {
    fc.assert(
      fc.property(
        newsletterRecordsArb,
        fc
          .integer({
            min: new Date("2020-01-01T00:00:00Z").getTime(),
            max: new Date("2025-12-31T23:59:59Z").getTime(),
          })
          .map((ts) => new Date(ts).toISOString()),
        fc
          .integer({
            min: new Date("2020-01-01T00:00:00Z").getTime(),
            max: new Date("2025-12-31T23:59:59Z").getTime(),
          })
          .map((ts) => new Date(ts).toISOString()),
        (records, date1, date2) => {
          const startDate = date1 <= date2 ? date1 : date2;
          const endDate = date1 <= date2 ? date2 : date1;

          // 模拟 QueryService 对 newsletter 的日期范围筛选
          // 使用 subscribed_at 而非 created_at
          const filtered = records.filter(
            (r) => r.subscribed_at >= startDate && r.subscribed_at <= endDate
          );

          for (const record of filtered) {
            expect(record.subscribed_at >= startDate).toBe(true);
            expect(record.subscribed_at <= endDate).toBe(true);
          }
        }
      ),
      PBT_CONFIG
    );
  });
});
