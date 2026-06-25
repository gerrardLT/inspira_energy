/**
 * 本地文件系统存储后端
 *
 * 职责：
 * - 实现 IStorageBackend 接口的本地文件系统版本
 * - 使用 UUID 文件名存储文件，保留原始扩展名
 * - 通过 UPLOAD_DIR 环境变量指定存储目录
 * - 所有错误封装为 StorageError，不暴露内部文件路径
 *
 * Requirements: 6.1, 6.3, 6.6, 6.7, 6.8
 */

import { promises as fs, constants, createReadStream } from "node:fs";
import { join, extname } from "node:path";
import { Readable } from "node:stream";
import crypto from "node:crypto";

import type { IStorageBackend } from "./adapter";
import { StorageError } from "./adapter";
import { logger } from "@/lib/logger";

/**
 * 本地文件系统存储后端
 *
 * 将文件存储在 UPLOAD_DIR 指定的目录中，
 * 使用 UUID + 原始扩展名作为文件标识符。
 */
export class LocalStorageBackend implements IStorageBackend {
  private readonly uploadDir: string;

  constructor() {
    const dir = process.env.UPLOAD_DIR;
    if (!dir) {
      throw new StorageError(
        "存储目录未配置",
        "connection_error"
      );
    }
    this.uploadDir = dir;
  }

  /**
   * 保存文件到本地文件系统
   *
   * 生成 UUID 文件名（保留原始扩展名），写入 UPLOAD_DIR 目录。
   *
   * @param filename - 原始文件名（用于提取扩展名）
   * @param data - 文件内容 Buffer
   * @param mimeType - MIME 类型（存储为 .meta 文件供 retrieve 使用）
   * @returns 存储标识符（UUID + 扩展名）
   */
  async store(filename: string, data: Buffer, mimeType: string): Promise<string> {
    const ext = extname(filename);
    const identifier = `${crypto.randomUUID()}${ext}`;
    const filePath = join(this.uploadDir, identifier);
    const metaPath = join(this.uploadDir, `${identifier}.meta`);

    try {
      await fs.writeFile(filePath, data);
      // 存储元数据（MIME 类型）供 retrieve 时读取
      await fs.writeFile(metaPath, JSON.stringify({ mimeType, size: data.length }), "utf-8");
    } catch (error) {
      throw this.wrapError(error, "store");
    }

    logger.info({ identifier }, "文件存储成功 (local)");
    return identifier;
  }

  /**
   * 获取文件流
   *
   * 返回 Web ReadableStream + 文件元数据。
   *
   * @param identifier - 存储标识符
   * @returns 包含 stream、mimeType、size 的对象
   */
  async retrieve(identifier: string): Promise<{
    stream: ReadableStream;
    mimeType: string;
    size: number;
  }> {
    const filePath = join(this.uploadDir, identifier);
    const metaPath = join(this.uploadDir, `${identifier}.meta`);

    try {
      // 验证文件存在
      await fs.access(filePath, constants.R_OK);
    } catch {
      throw new StorageError("文件不存在", "not_found");
    }

    // 读取元数据
    let mimeType = "application/octet-stream";
    let size = 0;

    try {
      const metaContent = await fs.readFile(metaPath, "utf-8");
      const meta = JSON.parse(metaContent) as { mimeType: string; size: number };
      mimeType = meta.mimeType;
      size = meta.size;
    } catch {
      // 元数据文件可能不存在（兼容旧文件），使用 stat 获取 size
      try {
        const stat = await fs.stat(filePath);
        size = stat.size;
      } catch {
        throw new StorageError("无法读取文件信息", "connection_error");
      }
    }

    // 创建 Node.js Readable 并转换为 Web ReadableStream
    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return { stream: webStream, mimeType, size };
  }

  /**
   * 检查文件是否存在
   *
   * @param identifier - 存储标识符
   * @returns 文件存在返回 true，否则返回 false
   */
  async exists(identifier: string): Promise<boolean> {
    const filePath = join(this.uploadDir, identifier);

    try {
      await fs.access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 删除文件
   *
   * 同时删除数据文件和元数据文件。
   *
   * @param identifier - 存储标识符
   */
  async delete(identifier: string): Promise<void> {
    const filePath = join(this.uploadDir, identifier);
    const metaPath = join(this.uploadDir, `${identifier}.meta`);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw this.wrapError(error, "delete");
    }

    // 尝试删除元数据文件（不存在时忽略）
    try {
      await fs.unlink(metaPath);
    } catch {
      // 元数据文件可能不存在，忽略
    }
  }

  /**
   * 验证存储目录可访问性
   *
   * 检查 UPLOAD_DIR 目录是否存在且可写。
   *
   * @returns 可访问返回 true，否则返回 false
   */
  async healthCheck(): Promise<boolean> {
    try {
      await fs.access(this.uploadDir, constants.W_OK);
      return true;
    } catch {
      logger.warn(
        { backend: "local" },
        "本地存储后端健康检查失败：目录不可写"
      );
      return false;
    }
  }

  /**
   * 将底层文件系统错误封装为 StorageError
   *
   * 根据 Node.js 错误码映射到 StorageErrorCode，
   * 使用通用错误消息，不暴露内部文件路径。
   */
  private wrapError(error: unknown, operation: string): StorageError {
    const nodeError = error as NodeJS.ErrnoException;

    logger.error(
      { operation, errCode: nodeError.code },
      `本地存储操作失败: ${operation}`
    );

    switch (nodeError.code) {
      case "ENOENT":
        return new StorageError("文件不存在", "not_found");
      case "EACCES":
      case "EPERM":
        return new StorageError("存储操作权限不足", "permission_denied");
      case "ENOSPC":
        return new StorageError("存储空间不足", "storage_full");
      default:
        return new StorageError("存储操作失败", "connection_error");
    }
  }
}
