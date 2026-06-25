/**
 * Property 5: File MIME Type Dual Validation
 *
 * 验证文件上传的 MIME 类型双重校验逻辑：
 * 文件仅在扩展名 AND Content-Type 都匹配允许列表时才被接受。
 * 扩展名和 MIME 类型不匹配、或任一不在允许列表中时，应被拒绝。
 *
 * **Validates: Requirements 2.3, 2.4, 7.1, 7.7**
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { FileStorageService } from "@/lib/upload/index";
import { FileStorageError } from "@/lib/errors";
import { FILE_CONSTRAINTS } from "@/types/api";

// ─── 测试数据定义 ─────────────────────────────────────────────────────────────────

/** 合法的扩展名到 MIME 类型映射 */
const VALID_PAIRS: Array<{ ext: string; mime: string }> = [
  { ext: ".pdf", mime: "application/pdf" },
  { ext: ".doc", mime: "application/msword" },
  { ext: ".docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { ext: ".xls", mime: "application/vnd.ms-excel" },
  { ext: ".xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { ext: ".jpg", mime: "image/jpeg" },
  { ext: ".jpeg", mime: "image/jpeg" },
  { ext: ".png", mime: "image/png" },
];

/** 不在允许列表中的扩展名 */
const INVALID_EXTENSIONS = [
  ".exe", ".bat", ".sh", ".js", ".html", ".php", ".py",
  ".zip", ".rar", ".svg", ".gif", ".bmp", ".mp3", ".mp4",
  ".dll", ".cmd", ".vbs", ".msi", ".iso",
];

/** 不在允许列表中的 MIME 类型 */
const INVALID_MIMES = [
  "application/x-executable",
  "application/x-msdownload",
  "text/html",
  "text/javascript",
  "application/javascript",
  "image/gif",
  "image/svg+xml",
  "application/zip",
  "application/x-rar-compressed",
  "video/mp4",
  "audio/mpeg",
  "application/octet-stream",
  "text/plain",
  "application/xml",
];

// ─── Mock 设置 ────────────────────────────────────────────────────────────────────

// Mock fs/promises 以避免真实磁盘 I/O
vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock uuid 以生成可预测的文件名
vi.mock("uuid", () => ({
  v4: () => "00000000-0000-4000-8000-000000000001",
}));

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/**
 * 创建模拟 File 对象
 */
function createMockFile(name: string, mimeType: string, size = 1024): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type: mimeType });
}

// ─── Generators ──────────────────────────────────────────────────────────────────

/** 生成一个合法的 (extension, mimeType) 对 */
const validPairArb = fc.constantFrom(...VALID_PAIRS);

/** 生成一个不在允许列表中的扩展名 */
const invalidExtensionArb = fc.constantFrom(...INVALID_EXTENSIONS);

/** 生成一个不在允许列表中的 MIME 类型 */
const invalidMimeArb = fc.constantFrom(...INVALID_MIMES);

/** 生成合法扩展名（从允许列表中选取） */
const validExtensionArb = fc.constantFrom(
  ...FILE_CONSTRAINTS.allowedExtensions as unknown as string[]
);

/** 生成合法 MIME 类型（从允许列表中选取） */
const validMimeTypeArb = fc.constantFrom(
  ...FILE_CONSTRAINTS.allowedMimeTypes as unknown as string[]
);

/**
 * 生成错误配对：合法扩展名 + 不匹配的合法 MIME 类型
 * 例如：.pdf + image/jpeg（扩展名和 MIME 各自合法，但彼此不匹配）
 */
const mismatchedValidPairArb = fc
  .tuple(validPairArb, validPairArb)
  .filter(([a, b]) => a.ext !== b.ext && a.mime !== b.mime)
  .map(([a, b]) => ({ ext: a.ext, mime: b.mime }));

// ─── Property Tests ──────────────────────────────────────────────────────────────

describe("Feature: backend-infrastructure, Property 5: File MIME Type Dual Validation", () => {
  beforeEach(() => {
    process.env.UPLOAD_DIR = "G:/test-uploads";
    vi.clearAllMocks();
  });

  it("应接受扩展名和 Content-Type 都匹配允许列表的文件", async () => {
    await fc.assert(
      fc.asyncProperty(validPairArb, async (pair) => {
        const file = createMockFile(`document${pair.ext}`, pair.mime);
        const result = await FileStorageService.validateAndStore([file]);

        expect(result).toHaveLength(1);
        expect(result[0].mimeType).toBe(pair.mime);
        expect(result[0].originalName).toBe(`document${pair.ext}`);
      }),
      { numRuns: 100 }
    );
  });

  it("应拒绝扩展名不在允许列表中的文件（即使 MIME 类型有效）", async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidExtensionArb,
        validMimeTypeArb,
        async (ext, mime) => {
          const file = createMockFile(`malicious${ext}`, mime);

          await expect(
            FileStorageService.validateAndStore([file])
          ).rejects.toThrow(FileStorageError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("应拒绝 MIME 类型不在允许列表中的文件（即使扩展名有效）", async () => {
    await fc.assert(
      fc.asyncProperty(
        validExtensionArb,
        invalidMimeArb,
        async (ext, mime) => {
          const file = createMockFile(`report${ext}`, mime);

          await expect(
            FileStorageService.validateAndStore([file])
          ).rejects.toThrow(FileStorageError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("应拒绝扩展名和 MIME 类型都不在允许列表中的文件", async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidExtensionArb,
        invalidMimeArb,
        async (ext, mime) => {
          const file = createMockFile(`payload${ext}`, mime);

          await expect(
            FileStorageService.validateAndStore([file])
          ).rejects.toThrow(FileStorageError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("应拒绝扩展名和 MIME 类型各自合法但彼此不匹配的文件", async () => {
    await fc.assert(
      fc.asyncProperty(mismatchedValidPairArb, async (pair) => {
        const file = createMockFile(`document${pair.ext}`, pair.mime);

        await expect(
          FileStorageService.validateAndStore([file])
        ).rejects.toThrow(FileStorageError);
      }),
      { numRuns: 100 }
    );
  });
});
