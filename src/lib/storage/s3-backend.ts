/**
 * S3 兼容对象存储后端
 *
 * 职责：
 * - 使用 @aws-sdk/client-s3 实现 IStorageBackend 接口
 * - 从环境变量读取 S3_ENDPOINT、S3_BUCKET、S3_ACCESS_KEY、S3_SECRET_KEY、S3_REGION
 * - 支持 store（PutObject）、retrieve（GetObject → ReadableStream）、exists（HeadObject）、delete（DeleteObject）
 * - healthCheck() 验证 Bucket 可访问性
 * - 所有错误封装为 StorageError，不暴露 AWS SDK 内部细节
 *
 * Requirements: 6.1, 6.4, 6.6, 6.7, 6.8
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { StorageError, type IStorageBackend } from "./adapter";
import { logger } from "@/lib/logger";
import * as path from "node:path";

// ─── S3 兼容对象存储后端 ─────────────────────────────────────────────────────────

export class S3StorageBackend implements IStorageBackend {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const region = process.env.S3_REGION;

    // 验证必需的环境变量（防御性检查，env.ts 已做校验）
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !region) {
      throw new StorageError(
        "S3 存储后端配置不完整",
        "connection_error"
      );
    }

    this.bucket = bucket;

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // forcePathStyle 适用于 MinIO 等 S3 兼容服务；AWS 官方 S3 应设为 false
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    });

    logger.info({ backendType: "s3", region }, "S3StorageBackend 实例已创建");
  }

  /**
   * 保存文件到 S3
   *
   * 生成 UUID 作为 object key（保留原始文件扩展名），
   * 执行 PutObject 操作，返回 UUID 格式的存储标识符。
   */
  async store(filename: string, data: Buffer, mimeType: string): Promise<string> {
    const ext = path.extname(filename);
    const key = `${crypto.randomUUID()}${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: data,
          ContentType: mimeType,
        })
      );

      logger.info(
        { operation: "store", mimeType, size: data.length },
        "S3 文件存储成功"
      );

      return key;
    } catch (error: unknown) {
      throw this.wrapError(error, "store");
    }
  }

  /**
   * 从 S3 获取文件流
   *
   * 执行 GetObject 操作，将 Body（SDK 内部 stream）转换为 Web ReadableStream，
   * 返回流 + ContentType + ContentLength。
   */
  async retrieve(identifier: string): Promise<{
    stream: ReadableStream;
    mimeType: string;
    size: number;
  }> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: identifier,
        })
      );

      const body = response.Body;
      if (!body) {
        throw new StorageError("文件内容为空", "not_found");
      }

      // AWS SDK v3 的 Body 是 Readable（Node stream），需转换为 Web ReadableStream
      const webStream = body.transformToWebStream();

      return {
        stream: webStream as ReadableStream,
        mimeType: response.ContentType ?? "application/octet-stream",
        size: response.ContentLength ?? 0,
      };
    } catch (error: unknown) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw this.wrapError(error, "retrieve");
    }
  }

  /**
   * 检查文件是否存在
   *
   * 执行 HeadObject 操作，成功返回 true，
   * 捕获 NotFound/NoSuchKey 错误返回 false。
   */
  async exists(identifier: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: identifier,
        })
      );
      return true;
    } catch (error: unknown) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw this.wrapError(error, "exists");
    }
  }

  /**
   * 删除文件
   *
   * 执行 DeleteObject 操作。
   * 注意：S3 DeleteObject 对不存在的 key 也返回成功（幂等）。
   */
  async delete(identifier: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: identifier,
        })
      );

      logger.info({ operation: "delete" }, "S3 文件删除成功");
    } catch (error: unknown) {
      throw this.wrapError(error, "delete");
    }
  }

  /**
   * 验证 S3 Bucket 可访问性
   *
   * 使用 ListObjectsV2 + MaxKeys=0 验证 Bucket 连通性和权限，
   * 比 HeadBucket 更可靠（某些 S3 兼容服务不完整支持 HeadBucket）。
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          MaxKeys: 0,
        })
      );

      logger.info({ backendType: "s3" }, "S3 存储后端健康检查通过");
      return true;
    } catch (error: unknown) {
      logger.error(
        { backendType: "s3", operation: "healthCheck" },
        "S3 存储后端健康检查失败"
      );
      return false;
    }
  }

  // ─── 私有辅助方法 ──────────────────────────────────────────────────────────────

  /**
   * 判断错误是否为 NotFound 类型
   */
  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === "object") {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      // AWS SDK NotFound 错误的 name 属性
      if (
        err.name === "NotFound" ||
        err.name === "NoSuchKey" ||
        err.$metadata?.httpStatusCode === 404
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * 判断错误是否为权限拒绝类型
   */
  private isAccessDeniedError(error: unknown): boolean {
    if (error && typeof error === "object") {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (
        err.name === "AccessDenied" ||
        err.$metadata?.httpStatusCode === 403
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * 将 AWS SDK 错误封装为 StorageError
   *
   * 规则：
   * - NotFound/NoSuchKey → "not_found"
   * - AccessDenied → "permission_denied"
   * - 其他所有错误 → "connection_error"
   * - 绝不暴露 AWS SDK 错误消息、S3 key 或 bucket 名称
   */
  private wrapError(error: unknown, operation: string): StorageError {
    // 记录内部错误日志用于调试（不对外暴露）
    logger.error(
      { operation, backendType: "s3" },
      "S3 存储操作失败"
    );

    if (this.isNotFoundError(error)) {
      return new StorageError("请求的文件不存在", "not_found");
    }

    if (this.isAccessDeniedError(error)) {
      return new StorageError("存储访问权限不足", "permission_denied");
    }

    // 所有其他错误统一为 connection_error
    return new StorageError("存储服务暂时不可用", "connection_error");
  }
}
