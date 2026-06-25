/**
 * Property 6: File Storage Path Traversal Prevention
 *
 * 验证文件存储服务对任何包含路径遍历序列的恶意文件名，
 * 都能安全地生成 UUID 存储文件名并确保路径始终在上传目录内。
 *
 * **Validates: Requirements 7.3**
 *
 * Tag: Feature: backend-infrastructure, Property 6: File Storage Path Traversal Prevention
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import path from "node:path";

// Mock fs/promises to capture stored path without actual file I/O
vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock uuid to return predictable but valid UUIDs
vi.mock("uuid", () => ({
  v4: () => "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
}));

const UPLOAD_DIR = "G:\\inspira_energy_uploads";

// UUID v4 pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Allowed extensions for generating valid files
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"] as const;

// MIME type mapping for valid combinations
const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * 生成包含路径遍历序列的恶意文件名
 */
function maliciousFilenameArb(): fc.Arbitrary<string> {
  const traversalSequences = [
    "../",
    "..\\",
    "....//",
    "....\\\\",
    "../../../",
    "..\\..\\..\\",
    "..%2f",
    "..%5c",
    "%2e%2e/",
    "%2e%2e\\",
  ];

  const maliciousPrefixes = [
    "../../../etc/passwd",
    "..\\..\\windows\\system32\\cmd.exe",
    "....//....//etc/hosts",
    "/tmp/evil",
    "C:\\evil",
    "\\\\server\\share\\evil",
    "\x00evil",
    "con",
    "nul",
    "com1",
    "../../../proc/self/environ",
  ];

  const extensionArb = fc.constantFrom(...ALLOWED_EXTENSIONS);

  return fc.oneof(
    // 带路径遍历前缀的文件名
    fc.tuple(fc.constantFrom(...maliciousPrefixes), extensionArb).map(
      ([prefix, ext]) => `${prefix}${ext}`
    ),
    // 路径遍历序列 + 随机文件名
    fc.tuple(
      fc.constantFrom(...traversalSequences),
      fc.string({ minLength: 1, maxLength: 20 }),
      extensionArb
    ).map(([seq, name, ext]) => `${seq}${name}${ext}`),
    // 多层路径遍历
    fc.tuple(
      fc.integer({ min: 1, max: 10 }),
      fc.constantFrom("../", "..\\"),
      extensionArb
    ).map(([depth, sep, ext]) => `${sep.repeat(depth)}evil${ext}`),
    // 绝对路径
    fc.tuple(
      fc.constantFrom("/", "C:\\", "D:\\", "\\\\", "/tmp/", "C:\\Windows\\"),
      fc.string({ minLength: 1, maxLength: 20 }),
      extensionArb
    ).map(([prefix, name, ext]) => `${prefix}${name}${ext}`),
    // 含 null 字节的文件名
    fc.tuple(
      fc.string({ minLength: 1, maxLength: 10 }),
      extensionArb
    ).map(([name, ext]) => `${name}\x00${ext}`),
    // 混合路径遍历 + 特殊字符
    fc.tuple(
      fc.constantFrom(...traversalSequences),
      fc.constantFrom(...traversalSequences),
      extensionArb
    ).map(([seq1, seq2, ext]) => `${seq1}${seq2}payload${ext}`)
  );
}

/**
 * 创建模拟 File 对象
 */
function createMockFile(filename: string, ext: string): File {
  const mimeType = EXTENSION_TO_MIME[ext] || "application/pdf";
  const content = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // PDF magic bytes
  const blob = new Blob([content], { type: mimeType });

  return new File([blob], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

describe("Feature: backend-infrastructure, Property 6: File Storage Path Traversal Prevention", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.UPLOAD_DIR = UPLOAD_DIR;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.UPLOAD_DIR;
  });

  it("stored filename is always UUID + original extension for any malicious filename", async () => {
    const { FileStorageService } = await import("@/lib/upload/index");

    await fc.assert(
      fc.asyncProperty(maliciousFilenameArb(), async (maliciousFilename) => {
        // 提取有效扩展名（FileStorageService 使用 path.basename 后取 extname）
        const basename = path.basename(maliciousFilename);
        const ext = path.extname(basename).toLowerCase();

        // 跳过没有有效扩展名的情况（会被 MIME 验证拒绝，不是本属性测试的关注点）
        if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
          return;
        }

        const mimeType = EXTENSION_TO_MIME[ext];
        if (!mimeType) {
          return;
        }

        const file = createMockFile(maliciousFilename, ext);

        const result = await FileStorageService.validateAndStore([file]);

        expect(result).toHaveLength(1);
        const storedFile = result[0];

        // 验证存储文件名匹配 UUID v4 + 原始扩展名
        const storedNameWithoutExt = storedFile.storedName.replace(ext, "");
        expect(storedNameWithoutExt).toMatch(UUID_V4_REGEX);
        expect(storedFile.storedName.endsWith(ext)).toBe(true);

        // 验证存储文件名不包含路径遍历字符
        expect(storedFile.storedName).not.toContain("../");
        expect(storedFile.storedName).not.toContain("..\\");
        expect(storedFile.storedName).not.toContain("\x00");
        expect(storedFile.storedName).not.toContain("..");

        // 验证解析后的路径在上传目录内
        const resolvedPath = path.resolve(storedFile.path);
        const resolvedUploadDir = path.resolve(UPLOAD_DIR);
        expect(
          resolvedPath.startsWith(resolvedUploadDir + path.sep) ||
            resolvedPath === resolvedUploadDir
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("resolved file path is always within configured UPLOAD_DIR", async () => {
    const { FileStorageService } = await import("@/lib/upload/index");

    // 测试特定的高风险路径遍历用例
    const dangerousFilenames = [
      "../../../etc/passwd.pdf",
      "..\\..\\windows\\system32\\cmd.exe.pdf",
      "\x00evil.pdf",
      "....//....//etc/hosts.png",
      "/tmp/evil.pdf",
      "C:\\evil.pdf",
      "\\\\server\\share\\evil.pdf",
      "../../../proc/self/environ.doc",
      "..%2f..%2f..%2fetc%2fpasswd.pdf",
      "....\\\\....\\\\windows.xlsx",
    ];

    for (const filename of dangerousFilenames) {
      const basename = path.basename(filename);
      const ext = path.extname(basename).toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
        continue;
      }

      const mimeType = EXTENSION_TO_MIME[ext];
      if (!mimeType) continue;

      const file = createMockFile(filename, ext);
      const result = await FileStorageService.validateAndStore([file]);

      expect(result).toHaveLength(1);

      const resolvedPath = path.resolve(result[0].path);
      const resolvedUploadDir = path.resolve(UPLOAD_DIR);

      // 路径必须在上传目录内
      expect(
        resolvedPath.startsWith(resolvedUploadDir + path.sep)
      ).toBe(true);

      // 存储文件名不能包含任何路径遍历序列
      expect(result[0].storedName).not.toMatch(/\.\./);
      expect(result[0].storedName).not.toContain("/");
      expect(result[0].storedName).not.toContain("\\");
    }
  });

  it("getFilePath also prevents path traversal for stored filenames", async () => {
    const { FileStorageService } = await import("@/lib/upload/index");

    await fc.assert(
      fc.property(maliciousFilenameArb(), (maliciousFilename) => {
        // getFilePath 应该对任何输入只使用 basename，确保安全
        const resultPath = FileStorageService.getFilePath(maliciousFilename);
        const resolvedPath = path.resolve(resultPath);
        const resolvedUploadDir = path.resolve(UPLOAD_DIR);

        // 核心安全属性：解析后的路径必须在上传目录内
        expect(
          resolvedPath.startsWith(resolvedUploadDir + path.sep) ||
            resolvedPath === resolvedUploadDir
        ).toBe(true);

        // 结果路径不能包含目录分隔符（即不能跨越子目录）
        const filename = path.basename(resultPath);
        expect(filename).toBe(path.basename(maliciousFilename));
      }),
      { numRuns: 100 }
    );
  });
});
