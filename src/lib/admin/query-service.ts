/**
 * 提交查询服务
 *
 * 职责：
 * - formType 映射到对应数据库表
 * - 支持状态筛选、日期范围筛选、邮箱子串匹配、跨字段搜索
 * - 实现 OFFSET/LIMIT 分页逻辑，结果按时间戳 DESC 排序
 * - 使用 Zod schema 验证查询参数
 *
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10
 */

import { z } from "zod";

import { pool } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ERROR_CODES } from "@/types/api";
import type { AdminFormType, PaginatedResult } from "@/types/api";
import { AppError } from "@/lib/errors";

// ─── Zod 验证 Schema ─────────────────────────────────────────────────────────────

/**
 * 查询参数验证 Schema
 * - status: 可选，仅允许 pending/contacted/closed
 * - startDate/endDate: 可选，ISO 8601 格式
 * - email: 可选，最长 254 字符
 * - search: 可选，最长 200 字符
 * - page: 默认 1，最小 1
 * - pageSize: 默认 20，最小 1，最大 100
 */
export const queryParamsSchema = z.object({
  status: z.enum(["pending", "contacted", "closed"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  email: z.string().max(254).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** 验证后的查询参数类型 */
export type ValidatedQueryParams = z.infer<typeof queryParamsSchema>;

// ─── 表配置映射 ──────────────────────────────────────────────────────────────────

/** 各表单类型对应的数据库表配置 */
interface TableConfig {
  /** 物理表名 */
  tableName: string;
  /** 时间戳列名（用于排序和日期范围筛选） */
  timestampCol: string;
  /** 跨字段搜索涉及的列名列表 */
  searchFields: string[];
}

/**
 * formType → 数据库表配置映射
 *
 * 注意事项：
 * - newsletter 使用 subscribed_at 而非 created_at
 * - lp-interest 使用 institution 字段，developer 使用 company_name/contact_name
 * - newsletter 仅有 email 字段可供搜索
 */
const TABLE_CONFIG: Record<AdminFormType, TableConfig> = {
  "lp-interest": {
    tableName: "lp_interest_submissions",
    timestampCol: "created_at",
    searchFields: ["name", "institution", "email"],
  },
  developer: {
    tableName: "developer_submissions",
    timestampCol: "created_at",
    searchFields: ["contact_name", "company_name", "email"],
  },
  contact: {
    tableName: "contact_submissions",
    timestampCol: "created_at",
    searchFields: ["name", "company", "email"],
  },
  newsletter: {
    tableName: "newsletter_subscriptions",
    timestampCol: "subscribed_at",
    searchFields: ["email"],
  },
};

// ─── SQL 标识符安全断言 ──────────────────────────────────────────────────────────

/**
 * 合法的 SQL 标识符正则：仅允许小写字母、数字、下划线
 * 编译时硬编码的 TABLE_CONFIG 值必须通过此校验，
 * 防止未来维护时引入非法标识符导致 SQL 注入。
 */
const SAFE_SQL_IDENTIFIER = /^[a-z][a-z0-9_]*$/;

/** 启动时断言 TABLE_CONFIG 中所有标识符均为安全的 SQL 标识符 */
(function assertTableConfigSafety() {
  for (const [formType, config] of Object.entries(TABLE_CONFIG)) {
    if (!SAFE_SQL_IDENTIFIER.test(config.tableName)) {
      throw new Error(`[SECURITY] TABLE_CONFIG["${formType}"].tableName "${config.tableName}" contains unsafe characters`);
    }
    if (!SAFE_SQL_IDENTIFIER.test(config.timestampCol)) {
      throw new Error(`[SECURITY] TABLE_CONFIG["${formType}"].timestampCol "${config.timestampCol}" contains unsafe characters`);
    }
    for (const field of config.searchFields) {
      if (!SAFE_SQL_IDENTIFIER.test(field)) {
        throw new Error(`[SECURITY] TABLE_CONFIG["${formType}"].searchFields contains unsafe identifier "${field}"`);
      }
    }
  }
})();

// ─── 错误类 ──────────────────────────────────────────────────────────────────────

/** 查询参数验证错误 (400) */
export class QueryValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, fields);
  }
}

// ─── 内部辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 构建 WHERE 子句和参数数组
 *
 * 根据查询参数动态生成 SQL WHERE 条件：
 * - status: 精确匹配
 * - startDate: 时间戳 >= 指定值（包含）
 * - endDate: 时间戳 <= 指定值（包含）
 * - email: ILIKE 大小写不敏感子串匹配
 * - search: 跨多字段 ILIKE 匹配（OR 逻辑）
 *
 * @param config - 表配置
 * @param params - 已验证的查询参数
 * @returns WHERE 子句片段数组和参数值数组
 */
function buildWhereClause(
  config: TableConfig,
  params: ValidatedQueryParams,
  formType: AdminFormType
): { conditions: string[]; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  // 状态筛选（newsletter 使用不同枚举，忽略 submission_status 筛选）
  if (params.status && formType !== "newsletter") {
    conditions.push(`status = $${paramIndex}`);
    values.push(params.status);
    paramIndex++;
  }

  // 日期范围筛选（包含边界）
  if (params.startDate) {
    conditions.push(`${config.timestampCol} >= $${paramIndex}`);
    values.push(params.startDate);
    paramIndex++;
  }

  if (params.endDate) {
    conditions.push(`${config.timestampCol} <= $${paramIndex}`);
    values.push(params.endDate);
    paramIndex++;
  }

  // 邮箱子串匹配（大小写不敏感）
  if (params.email) {
    conditions.push(`email ILIKE '%' || $${paramIndex} || '%'`);
    values.push(params.email);
    paramIndex++;
  }

  // 跨字段搜索（大小写不敏感，OR 逻辑）
  if (params.search && config.searchFields.length > 0) {
    const searchConditions = config.searchFields.map(
      (field) => `${field} ILIKE '%' || $${paramIndex} || '%'`
    );
    conditions.push(`(${searchConditions.join(" OR ")})`);
    values.push(params.search);
    paramIndex++;
  }

  return { conditions, values };
}

/**
 * 计算分页元数据
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

// ─── 查询服务 ────────────────────────────────────────────────────────────────────

export const QueryService = {
  /**
   * 验证并解析查询参数
   *
   * @param rawParams - 原始查询参数对象（通常从 URL searchParams 解析）
   * @returns 验证通过的查询参数
   * @throws QueryValidationError - 参数格式无效
   */
  validateParams(rawParams: Record<string, unknown>): ValidatedQueryParams {
    const result = queryParamsSchema.safeParse(rawParams);

    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        fields[path] = issue.message;
      }

      throw new QueryValidationError(
        "Invalid query parameters",
        fields
      );
    }

    return result.data;
  },

  /**
   * 查询指定表单类型的提交记录
   *
   * 执行流程：
   * 1. 根据 formType 获取表配置
   * 2. 构建动态 WHERE 子句
   * 3. 执行 COUNT 查询获取总数
   * 4. 执行分页数据查询
   * 5. 返回分页结果
   *
   * @param formType - 表单类型
   * @param params - 已验证的查询参数
   * @returns 分页查询结果
   */
  async query(
    formType: AdminFormType,
    params: ValidatedQueryParams
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const config = TABLE_CONFIG[formType];

    const { conditions, values } = buildWhereClause(config, params, formType);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const client = await pool.connect();
    try {
      // 1. 执行 COUNT 查询获取匹配记录总数
      const countSql = `SELECT COUNT(*) AS total FROM ${config.tableName} ${whereClause}`;
      const countResult = await client.query<{ total: string }>(
        countSql,
        values
      );
      const total = parseInt(countResult.rows[0].total, 10);

      // 2. 计算分页元数据
      const { page, pageSize } = params;
      const { totalPages, offset } = calculatePagination(total, page, pageSize);

      // 3. 当 page 超过 totalPages 时，返回空数据数组和正确的分页元数据
      if (total === 0 || page > totalPages) {
        return {
          data: [],
          pagination: { total, page, pageSize, totalPages },
        };
      }

      // 4. 执行分页数据查询
      const dataParamIndex = values.length + 1;
      const dataSql = `SELECT * FROM ${config.tableName} ${whereClause} ORDER BY ${config.timestampCol} DESC LIMIT $${dataParamIndex} OFFSET $${dataParamIndex + 1}`;
      const dataResult = await client.query(dataSql, [
        ...values,
        pageSize,
        offset,
      ]);

      return {
        data: dataResult.rows,
        pagination: { total, page, pageSize, totalPages },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown database error";
      logger.error(
        { formType, error: errorMessage, event: "query_service_error" },
        "Database query failed in QueryService"
      );
      throw new AppError(
        "An error occurred while querying submissions",
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    } finally {
      client.release();
    }
  },
};
