/**
 * 文件下载服务属性测试
 *
 * Property 1: 文件下载响应头格式正确性 — 验证 Content-Type 和 Content-Disposition 格式
 * Property 2: 错误响应不泄漏内部细节 — 验证错误消息不包含内部路径
 *
 * **Validates: Requirements 1.1, 1.4, 1.5**
 *
 * Test framework: Vitest + fast-check v4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";

// ─── Property 1 测试需要的导入 ──────────────────────────────────────────────────

import { encodeFilenameRFC5987 } from "@/lib/admin/download-service";

// ─── Property 2 测试需要的 Mocks ─────────────────────────────────────────────────

// Mock database pool
vi.mock("@/lib/db", () => ({
  pool: {
    connect: vi.fn(),
  },
}));

// Mock logger (静默)
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock storage adapter
vi.mock("@/lib/storage/adapter", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/storage/adapter")>();
  return {
    ...original,
    getStorageAdapter: vi.fn(),
  };
});

// ─── PBT 配置 ────────────────────────────────────────────────────────────────────

const PBT_CONFIG = { numRuns: 100 };

// ─── Property 1: 文件下载响应头格式正确性 ─────────────────────────────────────────

// Feature: backend-operations, Property 1: 文件下载响应头格式正确性
describe("Property 1: 文件下载响应头格式正确性", () => {
  it("encodeFilenameRFC5987 对任意文件名（含非 ASCII 字符）编码后不包含原始非 ASCII 字符", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme", minLength: 1, maxLength: 50 }), (filename) => {
        const encoded = encodeFilenameRFC5987(filename);

        // 编码结果不应包含原始非 ASCII 字符
        for (const char of encoded) {
          const code = char.charCodeAt(0);
          // 所有字符应在 ASCII 可打印范围内（percent-encoding 使用的字符集）
          expect(code).toBeLessThanOrEqual(127);
        }
      }),
      PBT_CONFIG
    );
  });

  it("encodeFilenameRFC5987 编码后可通过 decodeURIComponent 解码回原始文件名", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme", minLength: 1, maxLength: 50 }), (filename) => {
        const encoded = encodeFilenameRFC5987(filename);
        const decoded = decodeURIComponent(encoded);
        expect(decoded).toBe(filename);
      }),
      PBT_CONFIG
    );
  });

  it("encodeFilenameRFC5987 对特殊字符 ' ( ) * 进行 percent-encoding", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).map((s) => s + "'()*"),
        (filename) => {
          const encoded = encodeFilenameRFC5987(filename);

          // 编码后不应包含原始的 ' ( ) * 字符
          // 它们应被替换为 %27 %28 %29 %2A
          expect(encoded).not.toMatch(/['\(\)\*]/);
        }
      ),
      PBT_CONFIG
    );
  });

  it("Content-Disposition 格式为 attachment; filename*=UTF-8''<encoded>", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme", minLength: 1, maxLength: 50 }), (filename) => {
        const encoded = encodeFilenameRFC5987(filename);
        const contentDisposition = `attachment; filename*=UTF-8''${encoded}`;

        // 验证格式正确
        expect(contentDisposition).toMatch(
          /^attachment; filename\*=UTF-8''[^\s]+$/
        );
        expect(contentDisposition.startsWith("attachment; filename*=UTF-8''")).toBe(true);
      }),
      PBT_CONFIG
    );
  });
});

// ─── Property 2: 错误响应不泄漏内部细节 ──────────────────────────────────────────

// Feature: backend-operations, Property 2: 错误响应不泄漏内部细节
describe("Property 2: 错误响应不泄漏内部细节", () => {
  // 生成内部路径的 generator
  const internalPathGen = fc.oneof(
    fc.constant("G:/inspira_energy_uploads/file.pdf"),
    fc.constant("/var/data/storage/secret.doc"),
    fc.constant("C:\\Users\\admin\\uploads\\report.xlsx"),
    fc.tuple(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ minLength: 1, maxLength: 10 })).map(
      ([a, b]) => `/${a}/${b}/file.pdf`
    )
  );

  // 生成后端标识符的 generator
  const backendIdentifierGen = fc.oneof(
    fc.constant("s3"),
    fc.constant("aws"),
    fc.constant("bucket"),
    fc.constant("endpoint"),
    fc.constant("s3.amazonaws.com"),
    fc.constant("minio"),
    fc.constant("S3_BUCKET")
  );

  // 生成包含路径和后端标识的错误消息 generator
  const internalErrorMessageGen = fc.tuple(internalPathGen, backendIdentifierGen).map(
    ([path, backend]) => `Failed to read file from ${backend}: ${path} - ENOENT`
  );

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("StorageError 包含内部路径时，抛出的 FileIOError 不泄漏任何内部路径信息", async () => {
    const { StorageError, getStorageAdapter } = await import("@/lib/storage/adapter");
    const { DownloadService, FileIOError } = await import("@/lib/admin/download-service");
    const { pool } = await import("@/lib/db");

    await fc.assert(
      fc.asyncProperty(internalPathGen, async (internalPath) => {
        // Mock 数据库返回有效的文件记录
        const mockClient = {
          query: vi.fn().mockResolvedValue({
            rows: [
              {
                file_paths: [
                  {
                    originalName: "测试文件.pdf",
                    storedName: "test-file-id",
                    path: "uploads/test-file-id",
                    size: 1024,
                    mimeType: "application/pdf",
                  },
                ],
              },
            ],
          }),
          release: vi.fn(),
        };
        vi.mocked(pool.connect).mockResolvedValue(mockClient as never);

        // Mock storage adapter 抛出包含内部路径的 StorageError
        const mockStorage = {
          retrieve: vi.fn().mockRejectedValue(
            new StorageError(
              `I/O error reading ${internalPath}`,
              "connection_error"
            )
          ),
        };
        vi.mocked(getStorageAdapter).mockReturnValue(mockStorage as never);

        // 调用 DownloadService.getFile 并验证抛出的错误
        try {
          await DownloadService.getFile("test-file-id");
          // 不应该到达这里
          expect.fail("Should have thrown FileIOError");
        } catch (error) {
          // 验证抛出的是 FileIOError
          expect(error).toBeInstanceOf(FileIOError);

          // 验证错误消息不包含内部路径
          const errorMessage = (error as Error).message;
          expect(errorMessage).not.toContain(internalPath);

          // 验证错误消息是固定的通用字符串
          expect(errorMessage).toBe("An error occurred while retrieving the file");
        }
      }),
      PBT_CONFIG
    );
  });

  it("StorageError 包含后端标识符时，抛出的 FileIOError 不泄漏后端实现细节", async () => {
    const { StorageError, getStorageAdapter } = await import("@/lib/storage/adapter");
    const { DownloadService, FileIOError } = await import("@/lib/admin/download-service");
    const { pool } = await import("@/lib/db");

    await fc.assert(
      fc.asyncProperty(backendIdentifierGen, async (backendId) => {
        // Mock 数据库返回有效的文件记录
        const mockClient = {
          query: vi.fn().mockResolvedValue({
            rows: [
              {
                file_paths: [
                  {
                    originalName: "report.pdf",
                    storedName: "test-file-id",
                    path: "uploads/test-file-id",
                    size: 2048,
                    mimeType: "application/pdf",
                  },
                ],
              },
            ],
          }),
          release: vi.fn(),
        };
        vi.mocked(pool.connect).mockResolvedValue(mockClient as never);

        // Mock storage adapter 抛出包含后端标识的 StorageError
        const mockStorage = {
          retrieve: vi.fn().mockRejectedValue(
            new StorageError(
              `Connection failed to ${backendId}: timeout after 30s`,
              "connection_error"
            )
          ),
        };
        vi.mocked(getStorageAdapter).mockReturnValue(mockStorage as never);

        // 调用 DownloadService.getFile 并验证抛出的错误
        try {
          await DownloadService.getFile("test-file-id");
          expect.fail("Should have thrown FileIOError");
        } catch (error) {
          expect(error).toBeInstanceOf(FileIOError);

          const errorMessage = (error as Error).message;
          // 验证错误消息不包含后端标识符
          expect(errorMessage.toLowerCase()).not.toContain(backendId.toLowerCase());

          // 验证错误消息是固定的通用字符串
          expect(errorMessage).toBe("An error occurred while retrieving the file");
        }
      }),
      PBT_CONFIG
    );
  });

  it("任意内部错误消息（路径+后端标识+堆栈）均不会泄漏到客户端错误中", async () => {
    const { StorageError, getStorageAdapter } = await import("@/lib/storage/adapter");
    const { DownloadService, FileIOError } = await import("@/lib/admin/download-service");
    const { pool } = await import("@/lib/db");

    await fc.assert(
      fc.asyncProperty(internalErrorMessageGen, async (internalMessage) => {
        // Mock 数据库返回有效的文件记录
        const mockClient = {
          query: vi.fn().mockResolvedValue({
            rows: [
              {
                file_paths: [
                  {
                    originalName: "项目可研报告.pdf",
                    storedName: "test-file-id",
                    path: "uploads/test-file-id",
                    size: 4096,
                    mimeType: "application/pdf",
                  },
                ],
              },
            ],
          }),
          release: vi.fn(),
        };
        vi.mocked(pool.connect).mockResolvedValue(mockClient as never);

        // Mock storage adapter 抛出包含完整内部信息的 StorageError
        const mockStorage = {
          retrieve: vi.fn().mockRejectedValue(
            new StorageError(internalMessage, "connection_error")
          ),
        };
        vi.mocked(getStorageAdapter).mockReturnValue(mockStorage as never);

        try {
          await DownloadService.getFile("test-file-id");
          expect.fail("Should have thrown FileIOError");
        } catch (error) {
          expect(error).toBeInstanceOf(FileIOError);

          const errorMessage = (error as Error).message;

          // 验证错误消息不包含任何路径分隔符（表示内部路径泄漏）
          expect(errorMessage).not.toMatch(/[/\\]/);

          // 验证错误消息不包含驱动器号
          expect(errorMessage).not.toMatch(/[A-Z]:\\/i);

          // 验证错误消息是固定的通用字符串
          expect(errorMessage).toBe("An error occurred while retrieving the file");
        }
      }),
      PBT_CONFIG
    );
  });
});
