/**
 * 提交状态更新服务
 *
 * 职责：
 * - 使用 Zod 验证 status 值合法性（pending / contacted / closed）
 * - 根据 formType 映射到对应数据库表
 * - 查询提交记录是否存在，不存在返回 404
 * - 更新 status + updated_at，使用 RETURNING 获取更新后记录
 * - 状态更新成功后触发 WebhookService 异步通知
 * - newsletter 类型使用不同状态枚举，不支持此操作
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6
 */

import { z } from "zod";

import { pool } from "@/lib/db";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";
import { ERROR_CODES } from "@/types/api";
import type { AdminFormType } from "@/types/api";
import { WebhookService } from "@/lib/webhook";

// ─── Zod 验证 Schema ─────────────────────────────────────────────────────────────

/** 允许的提交状态值 */
const ALLOWED_STATUSES = ["pending", "contacted", "closed"] as const;

/**
 * 状态更新请求体验证 Schema
 * status 必须为 pending / contacted / closed 之一
 */
export const statusUpdateSchema = z.object({
  status: z.enum(ALLOWED_STATUSES),
});

/** 验证后的状态值类型 */
export type ValidatedStatus = z.infer<typeof statusUpdateSchema>["status"];

// ─── 表配置映射 ──────────────────────────────────────────────────────────────────

/** 支持状态更新的表单类型配置 */
interface StatusTableConfig {
  /** 物理表名 */
  tableName: string;
  /** 用于 Webhook 通知的姓名字段列名 */
  nameCol: string;
}

/**
 * 支持状态更新的 formType → 表配置映射
 *
 * 注意：newsletter 使用不同的状态枚举（active/unsubscribed），
 * 不支持 pending/contacted/closed 状态更新操作
 */
const STATUS_TABLE_CONFIG: Record<string, StatusTableConfig> = {
  "lp-interest": {
    tableName: "lp_interest_submissions",
    nameCol: "name",
  },
  developer: {
    tableName: "developer_submissions",
    nameCol: "contact_name",
  },
  contact: {
    tableName: "contact_submissions",
    nameCol: "name",
  },
};

/** 支持状态更新的 formType 集合 */
const SUPPORTED_FORM_TYPES = new Set(Object.keys(STATUS_TABLE_CONFIG));

// ─── 返回类型 ────────────────────────────────────────────────────────────────────

/** 状态更新成功返回的记录 */
export interface StatusUpdateResult {
  id: string;
  status: "pending" | "contacted" | "closed";
  updatedAt: string; // ISO 8601
}

// ─── 服务实现 ────────────────────────────────────────────────────────────────────

export const StatusService = {
  /**
   * 验证状态值合法性
   *
   * @param rawBody - 原始请求体
   * @returns 验证通过的状态值
   * @throws AppError (400) - 状态值不合法
   */
  validateStatus(rawBody: unknown): ValidatedStatus {
    const result = statusUpdateSchema.safeParse(rawBody);

    if (!result.success) {
      throw new AppError(
        `Invalid status value. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        { status: `Must be one of: ${ALLOWED_STATUSES.join(", ")}` }
      );
    }

    return result.data.status;
  },

  /**
   * 更新指定提交的状态
   *
   * 执行流程：
   * 1. 验证 formType 是否支持状态更新
   * 2. 执行 UPDATE + RETURNING 获取更新后的完整记录
   * 3. 若无行返回（submissionId 不存在），抛出 404
   * 4. 异步触发 WebhookService 通知
   * 5. 返回更新后的记录摘要
   *
   * @param formType - 表单类型
   * @param submissionId - 提交记录 ID
   * @param status - 目标状态值（已验证）
   * @returns 更新后的记录
   * @throws AppError (400) - formType 不支持状态更新（newsletter）
   * @throws AppError (404) - submissionId 不存在
   * @throws AppError (500) - 数据库操作失败
   */
  async updateStatus(
    formType: AdminFormType,
    submissionId: string,
    status: ValidatedStatus
  ): Promise<StatusUpdateResult> {
    // 1. 验证 formType 是否支持状态更新
    if (!SUPPORTED_FORM_TYPES.has(formType)) {
      throw new AppError(
        `Status update is not supported for form type "${formType}". Newsletter subscriptions use a different status model.`,
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    const config = STATUS_TABLE_CONFIG[formType];

    // 2. 执行 UPDATE ... RETURNING * 获取更新后的记录
    const client = await pool.connect();
    try {
      const sql = `UPDATE ${config.tableName} SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at, ${config.nameCol} AS name, email`;
      const result = await client.query<{
        id: string;
        status: string;
        updated_at: Date;
        name: string;
        email: string;
      }>(sql, [status, submissionId]);

      // 3. 无行返回 → submissionId 不存在
      if (result.rows.length === 0) {
        throw new AppError(
          "Submission not found",
          ERROR_CODES.NOT_FOUND,
          404
        );
      }

      const row = result.rows[0];

      // 4. 异步触发 Webhook 通知（fire-and-forget）
      WebhookService.sendNotificationAsync({
        formType,
        name: row.name,
        email: row.email,
        timestamp: new Date().toISOString(),
        summary: {
          action: "status_updated",
          newStatus: status,
        },
      });

      // 5. 返回更新后的记录摘要
      return {
        id: row.id,
        status: row.status as ValidatedStatus,
        updatedAt: row.updated_at.toISOString(),
      };
    } catch (error) {
      // 如果是已知的 AppError，直接重新抛出
      if (error instanceof AppError) {
        throw error;
      }

      // 数据库操作失败 → 500，不暴露内部细节
      const errorMessage =
        error instanceof Error ? error.message : "Unknown database error";
      logger.error(
        {
          formType,
          submissionId,
          error: errorMessage,
          event: "status_service_update_error",
        },
        "Database update failed in StatusService"
      );
      throw new AppError(
        "An error occurred while updating submission status",
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    } finally {
      client.release();
    }
  },
};
