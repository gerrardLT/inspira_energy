/**
 * 文件下载服务
 *
 * 职责：
 * - 通过 fileId（storedName）验证文件记录在 developer_submissions.filePaths JSONB 中存在
 * - 通过 StorageAdapter 获取文件流
 * - 生成正确的 Content-Type 和 Content-Disposition（RFC 5987 URL 编码）响应头元数据
 * - 错误处理：不存在返回 404，I/O 错误返回 500（不暴露内部路径）
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6
 */

import { pool } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getStorageAdapter, StorageError } from "@/lib/storage/adapter";
import { ERROR_CODES } from "@/types/api";

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

/** 文件下载结果 */
export interface FileDownloadResult {
  /** 文件内容流 */
  stream: ReadableStream;
  /** URL-encoded 原始文件名（用于 Content-Disposition） */
  filename: string;
  /** 文件 MIME 类型（用于 Content-Type） */
  mimeType: string;
  /** 文件大小（字节） */
  size: number;
}

/** filePaths JSONB 中单个文件的元数据结构 */
interface StoredFileMetadata {
  originalName: string;
  storedName: string;
  path: string;
  size: number;
  mimeType: string;
}

// ─── 错误类 ──────────────────────────────────────────────────────────────────────

/** 文件未找到错误 (404) */
export class FileNotFoundError extends AppError {
  constructor() {
    super("File not found", ERROR_CODES.NOT_FOUND, 404);
  }
}

/** 文件读取 I/O 错误 (500) — 不暴露内部细节 */
export class FileIOError extends AppError {
  constructor() {
    super("An error occurred while retrieving the file", ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

// ─── 内部辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 从数据库查询 fileId 对应的文件元数据
 *
 * 在 developer_submissions 表的 filePaths JSONB 列中查找
 * 包含指定 storedName 的记录，提取匹配的文件元数据。
 *
 * @param fileId - 存储文件名（UUID + 扩展名格式）
 * @returns 匹配的文件元数据，未找到返回 null
 */
async function findFileMetadata(fileId: string): Promise<StoredFileMetadata | null> {
  // 使用 JSONB containment 操作符 @> 查询：查找 filePaths 数组中 storedName 匹配的记录
  const client = await pool.connect();
  try {
    const result = await client.query<{ file_paths: StoredFileMetadata[] }>(
      `SELECT file_paths FROM developer_submissions WHERE file_paths @> $1::jsonb LIMIT 1`,
      [JSON.stringify([{ storedName: fileId }])]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const filePaths = result.rows[0].file_paths;

    // 从 filePaths 数组中找到精确匹配的文件条目
    if (!Array.isArray(filePaths)) {
      return null;
    }

    const matched = filePaths.find(
      (f: StoredFileMetadata) => f.storedName === fileId
    );

    return matched ?? null;
  } finally {
    client.release();
  }
}

/**
 * 生成 Content-Disposition 头的 filename* 值
 * 按 RFC 5987 对原始文件名进行 URL 编码
 *
 * @param originalFilename - 原始文件名（可能包含非 ASCII 字符）
 * @returns URL-encoded 文件名字符串
 */
export function encodeFilenameRFC5987(originalFilename: string): string {
  return encodeURIComponent(originalFilename)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

// ─── 下载服务 ────────────────────────────────────────────────────────────────────

export const DownloadService = {
  /**
   * 通过 fileId 获取文件下载流和元数据
   *
   * 流程：
   * 1. 查询 developer_submissions.filePaths 确认文件记录存在
   * 2. 从 StorageAdapter 获取文件流
   * 3. 返回流 + 元数据（filename 已 URL-encoded）
   *
   * @param fileId - 存储文件名（UUID + 扩展名格式，如 "a1b2c3d4-...-e5f6.pdf"）
   * @returns FileDownloadResult 包含流和响应头所需的元数据
   * @throws FileNotFoundError - fileId 不存在于数据库记录中 (404)
   * @throws FileIOError - 存储后端 I/O 错误 (500)
   */
  async getFile(fileId: string): Promise<FileDownloadResult> {
    // 1. 验证 fileId 在数据库 filePaths JSONB 中存在
    const metadata = await findFileMetadata(fileId);

    if (!metadata) {
      logger.info({ fileId }, "File download requested but not found in database records");
      throw new FileNotFoundError();
    }

    // 2. 从 StorageAdapter 获取文件流
    try {
      const storage = getStorageAdapter();
      const { stream, mimeType, size } = await storage.retrieve(fileId);

      // 3. 生成 URL-encoded 的原始文件名
      const encodedFilename = encodeFilenameRFC5987(metadata.originalName);

      return {
        stream,
        filename: encodedFilename,
        // 优先使用数据库中存储的 mimeType（始终准确），仅在 DB 无值时回退到 StorageAdapter
        mimeType: metadata.mimeType || mimeType,
        size: size || metadata.size,
      };
    } catch (error) {
      // StorageError 分类处理
      if (error instanceof StorageError) {
        if (error.errorCode === "not_found") {
          // 数据库有记录但物理文件不存在 — 仍返回 404
          logger.warn(
            { fileId, errorCode: error.errorCode },
            "File record exists in database but physical file not found in storage"
          );
          throw new FileNotFoundError();
        }

        // 其他存储错误（connection_error、permission_denied、storage_full）→ 500
        logger.error(
          { fileId, errorCode: error.errorCode },
          "Storage I/O error during file retrieval"
        );
        throw new FileIOError();
      }

      // 未知错误 → 500，不暴露内部信息
      logger.error(
        { fileId, error: error instanceof Error ? error.message : "Unknown error" },
        "Unexpected error during file retrieval"
      );
      throw new FileIOError();
    }
  },
};
