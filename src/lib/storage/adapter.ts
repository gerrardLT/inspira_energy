/**
 * 文件存储抽象层 — 接口定义与工厂函数
 *
 * 职责：
 * - 定义统一的存储后端接口 (IStorageBackend)
 * - 定义存储操作错误类型 (StorageError)
 * - 根据 STORAGE_BACKEND 环境变量选择并实例化对应后端
 * - 提供单例获取函数，避免重复创建实例
 *
 * Requirements: 6.1, 6.2, 6.5, 6.7
 */

import type { StorageBackendType, StorageErrorCode } from "@/types/api";
import { logger } from "@/lib/logger";

// ─── 存储操作错误 ────────────────────────────────────────────────────────────────

/**
 * 存储操作错误
 *
 * 封装底层存储后端（本地文件系统、S3）的操作异常，
 * 提供枚举化的 errorCode 分类，不暴露后端实现细节。
 */
export class StorageError extends Error {
  readonly errorCode: StorageErrorCode;

  constructor(message: string, errorCode: StorageErrorCode) {
    super(message);
    this.name = "StorageError";
    this.errorCode = errorCode;
  }
}

// ─── 存储后端统一接口 ────────────────────────────────────────────────────────────

/**
 * 存储后端统一接口
 *
 * 所有存储后端实现必须遵循此接口，确保调用方无需关心底层实现。
 */
export interface IStorageBackend {
  /** 保存文件，返回存储标识符（后端无关的唯一标识） */
  store(filename: string, data: Buffer, mimeType: string): Promise<string>;

  /** 获取文件流，返回 ReadableStream + 元数据 */
  retrieve(identifier: string): Promise<{
    stream: ReadableStream;
    mimeType: string;
    size: number;
  }>;

  /** 检查文件是否存在 */
  exists(identifier: string): Promise<boolean>;

  /** 删除文件 */
  delete(identifier: string): Promise<void>;

  /** 验证存储后端连通性（启动时调用） */
  healthCheck(): Promise<boolean>;
}

// ─── 工厂函数 ────────────────────────────────────────────────────────────────────

/**
 * 解析并验证 STORAGE_BACKEND 环境变量值
 *
 * 如果值为 "local" 或 "s3"，直接返回对应类型。
 * 否则回退到 "local" 并发出 warn 日志。
 */
function resolveBackendType(): StorageBackendType {
  const raw = process.env.STORAGE_BACKEND;

  if (raw === "local" || raw === "s3") {
    return raw;
  }

  // 未知值或未设置 → 回退到 "local" 并记录警告
  logger.warn(
    { configuredValue: raw ?? "(undefined)" },
    `STORAGE_BACKEND 值无效或未设置 ("${raw ?? ""}")，回退到 "local" 后端`
  );

  return "local";
}

/**
 * 创建存储适配器实例
 *
 * 根据 STORAGE_BACKEND 环境变量选择对应后端实现。
 * 使用 lazy-import 策略：仅在选择 S3 后端时才加载 @aws-sdk/client-s3 相关模块，
 * 避免在使用本地存储时引入不必要的依赖。
 *
 * @returns 对应后端的 IStorageBackend 实例
 */
export function createStorageAdapter(): IStorageBackend {
  const backendType = resolveBackendType();

  logger.info(
    { backendType },
    `存储后端初始化: ${backendType}`
  );

  if (backendType === "s3") {
    // Lazy-import S3 后端，避免在使用 local 时加载 AWS SDK
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3StorageBackend } = require("./s3-backend") as {
      S3StorageBackend: new () => IStorageBackend;
    };
    return new S3StorageBackend();
  }

  // 默认：本地文件系统后端
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LocalStorageBackend } = require("./local-backend") as {
    LocalStorageBackend: new () => IStorageBackend;
  };
  return new LocalStorageBackend();
}

// ─── 单例获取函数 ────────────────────────────────────────────────────────────────

/** 全局存储适配器单例（延迟初始化） */
let storageAdapterInstance: IStorageBackend | null = null;

/**
 * 获取全局存储适配器单例
 *
 * 首次调用时通过 createStorageAdapter() 创建实例并缓存，
 * 后续调用直接返回缓存的实例。
 *
 * @returns 全局共享的 IStorageBackend 实例
 */
export function getStorageAdapter(): IStorageBackend {
  if (!storageAdapterInstance) {
    storageAdapterInstance = createStorageAdapter();
  }
  return storageAdapterInstance;
}
