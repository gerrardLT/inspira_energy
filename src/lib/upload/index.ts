/**
 * 文件存储服务
 * 负责文件验证（MIME 类型双重校验、大小限制、数量限制）和安全存储
 * 使用 UUID 生成唯一文件名，防止路径遍历攻击
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

import { FileStorageError } from "@/lib/errors";
import { FILE_CONSTRAINTS } from "@/types/api";

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

/** 存储完成后返回的文件元数据 */
export interface StoredFile {
  /** 用户上传时的原始文件名 */
  originalName: string;
  /** 系统生成的存储文件名（UUID + 原始扩展名） */
  storedName: string;
  /** 文件在服务器上的完整路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件 MIME 类型 */
  mimeType: string;
}

// ─── 扩展名与 MIME 类型映射 ──────────────────────────────────────────────────────

/**
 * 扩展名到允许的 MIME 类型映射
 * 用于双重验证：扩展名和 Content-Type 必须匹配
 */
const EXTENSION_TO_MIME: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
};

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/**
 * 获取上传目录路径
 * 优先使用 UPLOAD_DIR 环境变量，未设置时抛出错误
 */
function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR;
  if (!dir) {
    throw FileStorageError.storageFailure("UPLOAD_DIR 环境变量未配置");
  }
  return dir;
}

/**
 * 从文件名中安全提取扩展名
 * 仅提取最后一个扩展名，转为小写，防止多重扩展名绕过
 */
function extractSafeExtension(filename: string): string {
  // 移除路径分隔符，只取文件名部分
  const basename = path.basename(filename);
  return path.extname(basename).toLowerCase();
}

/**
 * 验证扩展名是否在允许列表中
 */
function isAllowedExtension(ext: string): boolean {
  return (FILE_CONSTRAINTS.allowedExtensions as readonly string[]).includes(ext);
}

/**
 * 验证 MIME 类型是否在允许列表中
 */
function isAllowedMimeType(mimeType: string): boolean {
  return (FILE_CONSTRAINTS.allowedMimeTypes as readonly string[]).includes(mimeType);
}

/**
 * 双重验证：扩展名和 MIME 类型必须匹配且都在允许列表中
 * 防止通过修改 Content-Type 或扩展名绕过安全检查
 */
function validateMimeTypeMatch(ext: string, mimeType: string): boolean {
  if (!isAllowedExtension(ext) || !isAllowedMimeType(mimeType)) {
    return false;
  }

  // 验证扩展名与 MIME 类型的对应关系
  const allowedMimes = EXTENSION_TO_MIME[ext];
  if (!allowedMimes) {
    return false;
  }

  return allowedMimes.includes(mimeType);
}

/**
 * 验证存储路径是否在上传目录内（防止路径遍历）
 * 使用 path.resolve 解析实际路径，确保不会跳出上传目录
 */
function isPathWithinUploadDir(filePath: string, uploadDir: string): boolean {
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDir);

  // 确保解析后的路径以上传目录为前缀
  // 添加路径分隔符确保不会匹配到同名前缀目录
  return (
    resolvedPath === resolvedUploadDir ||
    resolvedPath.startsWith(resolvedUploadDir + path.sep)
  );
}

// ─── FileStorageService ─────────────────────────────────────────────────────────

export const FileStorageService = {
  /**
   * 验证并存储上传的文件
   *
   * 验证流程：
   * 1. 文件数量检查（≤ 5 个）
   * 2. 每个文件：大小检查（≤ 10MB）
   * 3. 每个文件：MIME 类型双重验证（扩展名 + Content-Type 必须匹配）
   * 4. 生成 UUID 文件名，写入磁盘
   *
   * @param files - 要存储的 File 对象数组
   * @returns 存储完成后的文件元数据数组
   * @throws FileStorageError - 验证失败或 I/O 错误时抛出
   */
  async validateAndStore(files: File[]): Promise<StoredFile[]> {
    // 1. 验证文件数量
    if (files.length > FILE_CONSTRAINTS.maxCount) {
      throw FileStorageError.tooManyFiles(FILE_CONSTRAINTS.maxCount);
    }

    const uploadDir = getUploadDir();

    // 确保上传目录存在
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      throw FileStorageError.storageFailure(
        `无法创建上传目录: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }

    const storedFiles: StoredFile[] = [];

    for (const file of files) {
      // 2. 验证文件大小
      if (file.size > FILE_CONSTRAINTS.maxSize) {
        throw FileStorageError.tooLarge(FILE_CONSTRAINTS.maxSize / (1024 * 1024));
      }

      // 3. 双重验证 MIME 类型
      const ext = extractSafeExtension(file.name);
      const mimeType = file.type;

      if (!validateMimeTypeMatch(ext, mimeType)) {
        throw FileStorageError.invalidType(FILE_CONSTRAINTS.allowedExtensions);
      }

      // 4. 生成安全的存储文件名（UUID + 原始扩展名）
      const storedName = `${uuidv4()}${ext}`;
      const storedPath = path.join(uploadDir, storedName);

      // 5. 验证最终路径在上传目录内（额外安全保障）
      if (!isPathWithinUploadDir(storedPath, uploadDir)) {
        throw FileStorageError.storageFailure("文件存储路径安全验证失败");
      }

      // 6. 写入文件
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(storedPath, buffer);
      } catch (error) {
        throw FileStorageError.storageFailure(
          `文件写入失败: ${error instanceof Error ? error.message : "未知 I/O 错误"}`
        );
      }

      storedFiles.push({
        originalName: file.name,
        storedName,
        path: storedPath,
        size: file.size,
        mimeType,
      });
    }

    return storedFiles;
  },

  /**
   * 根据存储文件名获取完整文件路径
   *
   * @param filename - 存储时生成的文件名（UUID + 扩展名）
   * @returns 文件的完整路径
   * @throws FileStorageError - 如果路径解析到上传目录之外
   */
  getFilePath(filename: string): string {
    const uploadDir = getUploadDir();
    // 防止路径遍历：仅使用 basename
    const safeName = path.basename(filename);
    const filePath = path.join(uploadDir, safeName);

    if (!isPathWithinUploadDir(filePath, uploadDir)) {
      throw FileStorageError.storageFailure("文件路径安全验证失败");
    }

    return filePath;
  },
};
