# Design Document: Backend Infrastructure

## Overview

本设计文档描述 Inspira Energy 新加坡新能源基金投资平台官网的后端基础设施架构。系统基于 Next.js 16 App Router 的 API Route Handlers 构建，采用分层架构模式，将请求处理、业务逻辑、数据持久化和外部服务调用解耦。

### 设计目标

- 为 4 个前端表单（LP 投资意向、开发商路条提交、联系咨询、Newsletter 订阅）提供完整的后端 API
- 使用 PostgreSQL 实现可靠的数据持久化
- 使用 Redis 实现请求频率控制和热数据缓存
- 实现异步邮件通知（团队通知 + 提交者确认）
- 支持安全的文件上传与存储
- 统一的输入验证、错误处理和结构化日志

### 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| API 层 | Next.js 16 Route Handlers | 项目已有基础，零额外配置 |
| 验证层 | Zod v4 | 已在项目依赖中，TypeScript-first schema 验证 |
| ORM | Drizzle ORM + node-postgres | 轻量级、无代码生成、SQL-like API、优秀的 TypeScript 类型推断 |
| 缓存 | ioredis | 功能完整的 Redis 客户端，支持集群和哨兵模式 |
| 邮件 | nodemailer | Node.js 标准 SMTP 客户端，支持 HTML 模板 |
| 日志 | pino | 高性能结构化 JSON 日志，低开销 |
| 文件上传 | Next.js FormData API + fs | 原生支持 multipart/form-data |

## Architecture

### 分层架构

```mermaid
graph TB
    subgraph "客户端层"
        A[React 19 前端表单]
    end

    subgraph "API 层 - Next.js Route Handlers"
        B["/api/forms/lp-interest"]
        C["/api/forms/developer"]
        D["/api/forms/contact"]
        E["/api/forms/newsletter"]
        F["/api/newsletter/unsubscribe"]
        G["/api/upload"]
    end

    subgraph "中间件层"
        H[Rate Limiter]
        I[Input Validator]
        J[Request ID Generator]
        K[CORS Handler]
    end

    subgraph "服务层"
        L[FormService]
        M[EmailService]
        N[FileStorageService]
        O[CacheService]
    end

    subgraph "数据层"
        P[(PostgreSQL - G Drive)]
        Q[(Redis - G Drive)]
        R[File System - G Drive]
    end

    A --> B & C & D & E
    B & C & D & E --> H --> I --> J
    J --> L
    L --> M & N & O
    L --> P
    O --> Q
    N --> R
    M --> S[SMTP Server]
```

### 请求处理流程

```mermaid
sequenceDiagram
    participant Client as 前端
    participant API as Route Handler
    participant RL as Rate Limiter
    participant Val as Validator
    participant Svc as FormService
    participant DB as PostgreSQL
    participant Email as EmailService
    participant Cache as Redis

    Client->>API: POST /api/forms/{type}
    API->>API: 生成 Request ID
    API->>RL: 检查频率限制
    alt 超出限制
        RL-->>Client: 429 + Retry-After
    end
    RL->>Val: 验证输入
    alt 验证失败
        Val-->>Client: 400 + 字段错误
    end
    Val->>Svc: 处理表单数据
    Svc->>DB: 持久化数据
    alt DB 失败
        DB-->>Client: 500/503 错误
    end
    Svc-->>Client: 200 成功响应
    Svc--)Email: 异步发送邮件
    Note over Email: 失败重试 3 次（1s, 2s, 4s）
```

### 目录结构

```
src/
├── app/
│   └── api/
│       ├── forms/
│       │   ├── lp-interest/
│       │   │   └── route.ts
│       │   ├── developer/
│       │   │   └── route.ts
│       │   ├── contact/
│       │   │   └── route.ts
│       │   └── newsletter/
│       │       └── route.ts
│       ├── newsletter/
│       │   └── unsubscribe/
│       │       └── route.ts
│       └── upload/
│           └── route.ts
├── lib/
│   ├── db/
│   │   ├── index.ts          // 连接池配置
│   │   ├── schema.ts         // Drizzle schema 定义
│   │   └── migrate.ts        // 迁移脚本
│   ├── redis/
│   │   ├── index.ts          // Redis 连接
│   │   └── rate-limiter.ts   // 滑动窗口限流
│   ├── email/
│   │   ├── index.ts          // 邮件服务
│   │   └── templates/        // HTML 邮件模板
│   ├── upload/
│   │   └── index.ts          // 文件存储服务
│   ├── validation/
│   │   ├── schemas.ts        // Zod schemas
│   │   └── sanitizer.ts      // 输入消毒
│   ├── logger.ts             // pino 结构化日志
│   ├── errors.ts             // 统一错误类型
│   └── middleware.ts         // 通用中间件组合
└── types/
    └── api.ts                // API 类型定义
```

## Components and Interfaces

### 1. API Route Handlers（控制器层）

每个 Route Handler 负责：
- 解析请求体（JSON 或 FormData）
- 调用中间件管道（rate limit → validate → sanitize）
- 委托给 FormService 处理业务逻辑
- 返回标准化 JSON 响应

```typescript
// src/app/api/forms/lp-interest/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. 生成 request ID
  // 2. Rate limit 检查
  // 3. 解析 & 验证
  // 4. 调用 FormService
  // 5. 返回标准响应
}

// 拒绝非 POST 方法
export async function GET() { /* 405 */ }
export async function PUT() { /* 405 */ }
export async function DELETE() { /* 405 */ }
```

### 2. FormService（业务逻辑层）

```typescript
interface FormService {
  submitLPInterest(data: LPInterestInput, requestId: string): Promise<FormResult>;
  submitDeveloper(data: DeveloperInput, files: FileInput[], requestId: string): Promise<FormResult>;
  submitContact(data: ContactInput, requestId: string): Promise<FormResult>;
  submitNewsletter(data: NewsletterInput, requestId: string): Promise<FormResult>;
  unsubscribeNewsletter(token: string, requestId: string): Promise<FormResult>;
}

interface FormResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string; fields?: Record<string, string> };
}
```

### 3. EmailService（邮件服务）

```typescript
interface EmailService {
  sendTeamNotification(options: TeamNotificationOptions): Promise<void>;
  sendSubmitterConfirmation(options: ConfirmationOptions): Promise<void>;
  sendWelcomeEmail(email: string, unsubscribeToken: string, locale: string): Promise<void>;
}

interface TeamNotificationOptions {
  formType: "lp-interest" | "developer" | "contact-investor" | "contact-general";
  formData: Record<string, unknown>;
  fileLinks?: string[];
}

interface ConfirmationOptions {
  email: string;
  formType: string;
  locale: string;  // "zh" | "en"，来自提交页面的 locale
}
```

邮件发送策略：
- 异步执行，不阻塞 API 响应
- 失败重试：指数退避（1s → 2s → 4s），最多 3 次
- 全部失败后标记 `email_failed`，不影响提交状态

### 4. FileStorageService（文件存储服务）

```typescript
interface FileStorageService {
  validateAndStore(files: File[]): Promise<StoredFile[]>;
  getFilePath(filename: string): string;
}

interface StoredFile {
  originalName: string;
  storedName: string;   // UUID + 原扩展名
  path: string;
  size: number;
  mimeType: string;
}

// 验证规则
const FILE_CONSTRAINTS = {
  maxSize: 10 * 1024 * 1024,  // 10MB
  maxCount: 5,
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ],
  allowedExtensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"],
};
```

### 5. CacheService / RateLimiter（缓存与限流）

```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  isAvailable(): boolean;
}

interface RateLimiter {
  /**
   * 滑动窗口限流检查
   * @returns null 表示通过，number 表示需要等待的秒数
   */
  check(ip: string, formType: string): Promise<number | null>;
}

// 配置
const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  windowSeconds: 60,
  // 每个 IP + formType 组合独立计数
};
```

### 6. Logger（结构化日志）

```typescript
interface LogEntry {
  requestId: string;
  timestamp: string;  // ISO 8601
  level: "info" | "warn" | "error";
  formType?: string;
  event: string;
  result?: "success" | "validation_failed" | "persistence_failed" | "email_failed";
  details?: Record<string, unknown>;
}
```

### 7. 中间件组合器

```typescript
type MiddlewareHandler = (
  request: NextRequest,
  context: RequestContext
) => Promise<NextResponse | null>;

interface RequestContext {
  requestId: string;
  clientIp: string;
  locale: string;
}

/**
 * 组合多个中间件，按顺序执行
 * 任一中间件返回 NextResponse 则短路返回
 */
function composeMiddleware(...handlers: MiddlewareHandler[]): MiddlewareHandler;
```

## Data Models

### PostgreSQL Schema

使用 Drizzle ORM 定义 schema：

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, pgEnum, jsonb, numeric } from "drizzle-orm/pg-core";

// 枚举定义
export const submissionStatusEnum = pgEnum("submission_status", ["pending", "contacted", "closed"]);
export const newsletterStatusEnum = pgEnum("newsletter_status", ["active", "unsubscribed"]);
export const contactFormTypeEnum = pgEnum("contact_form_type", ["investor", "general"]);

// LP 投资意向表
export const lpInterestSubmissions = pgTable("lp_interest_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  institution: varchar("institution", { length: 200 }).notNull(),
  position: varchar("position", { length: 100 }),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  fundTypes: jsonb("fund_types").notNull(),      // string[]
  regions: jsonb("regions").default([]),          // string[]
  investmentSize: varchar("investment_size", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  status: submissionStatusEnum("status").default("pending").notNull(),
});

// 开发商路条提交表
export const developerSubmissions = pgTable("developer_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  projectType: varchar("project_type", { length: 100 }).notNull(),
  capacityMw: numeric("capacity_mw", { precision: 8, scale: 2 }).notNull(),
  projectStage: varchar("project_stage", { length: 100 }),
  expectedConstructionDate: varchar("expected_construction_date", { length: 20 }),
  notes: text("notes"),
  filePaths: jsonb("file_paths").default([]),    // StoredFile[]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  status: submissionStatusEnum("status").default("pending").notNull(),
});

// 联系咨询表
export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formType: contactFormTypeEnum("form_type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  company: varchar("company", { length: 200 }),
  position: varchar("position", { length: 100 }),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  fundTypes: jsonb("fund_types"),
  regions: jsonb("regions"),
  investmentSize: varchar("investment_size", { length: 50 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  status: submissionStatusEnum("status").default("pending").notNull(),
});

// Newsletter 订阅表
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow().notNull(),
  status: newsletterStatusEnum("status").default("active").notNull(),
  unsubscribeToken: uuid("unsubscribe_token").defaultRandom().notNull().unique(),
});
```

### 连接池配置

```typescript
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 2,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool);
```

### Redis 连接配置

```typescript
// src/lib/redis/index.ts
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  connectTimeout: 5_000,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

let isAvailable = true;

redis.on("error", () => { isAvailable = false; });
redis.on("connect", () => { isAvailable = true; });

export { redis, isAvailable };
```

### 环境变量

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/inspira_energy

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@inspiraenergy.com
SMTP_PASS=secret
SMTP_FROM=noreply@inspiraenergy.com

# Email Recipients
EMAIL_IR_TEAM=ir@inspiraenergy.com
EMAIL_DEV_TEAM=development@inspiraenergy.com
EMAIL_SUPPORT_TEAM=support@inspiraenergy.com

# File Storage
UPLOAD_DIR=G:/inspira_energy_uploads

# App
CORS_ORIGIN=https://www.inspiraenergy.com
```

### 滑动窗口限流算法

采用 Redis Sorted Set 实现精确滑动窗口：

```typescript
// src/lib/redis/rate-limiter.ts
async function checkRateLimit(ip: string, formType: string): Promise<number | null> {
  const key = `rate_limit:${formType}:${ip}`;
  const now = Date.now();
  const windowStart = now - 60_000;

  // 使用 Redis pipeline 原子操作
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);  // 移除过期记录
  pipeline.zadd(key, now.toString(), `${now}-${Math.random()}`);  // 添加当前请求
  pipeline.zcard(key);                               // 统计窗口内请求数
  pipeline.expire(key, 61);                         // 设置 key 过期

  const results = await pipeline.exec();
  const count = results?.[2]?.[1] as number;

  if (count > 5) {
    // 获取最早的请求时间，计算剩余等待秒数
    const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
    const oldestTime = Number(oldest[1]);
    const retryAfter = Math.ceil((oldestTime + 60_000 - now) / 1000);
    return Math.max(retryAfter, 1);
  }

  return null; // 通过
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Form Data Persistence Round-Trip

*For any* valid form submission (LP interest, developer, contact, or newsletter), persisting the data to PostgreSQL and then retrieving it by ID shall produce a record where all user-provided field values are equivalent to the original input, and the `created_at` timestamp is a valid UTC datetime.

**Validates: Requirements 1.6, 2.10, 3.7, 4.6, 5.6**

### Property 2: Invalid Input Rejection with Field-Specific Errors

*For any* form submission containing one or more validation violations (missing required fields, empty required strings, invalid email format, email exceeding 254 characters, fund_type not in predefined list, capacity_mw outside 0.1–10000 range), the Form_Service shall return a 400 status code with an error response that identifies each specific field that failed validation.

**Validates: Requirements 1.2, 1.3, 1.9, 2.2, 3.3, 4.2**

### Property 3: Input Sanitization Invariant

*For any* text input string, after sanitization the output shall contain zero `<script>` tags, zero HTML event handler attributes (e.g., `onclick`, `onerror`, `onload`), and all `<`, `>`, `&`, `"`, `'` characters shall be encoded as their corresponding HTML entities.

**Validates: Requirements 9.2**

### Property 4: String Length Enforcement

*For any* string input where the value exceeds 1000 characters for a single-line field or 5000 characters for a multi-line field, the Form_Service shall reject the request with a 400 status code identifying which field exceeded its length limit.

**Validates: Requirements 9.1**

### Property 5: File MIME Type Dual Validation

*For any* uploaded file, the File_Storage shall accept it if and only if both the file extension AND the Content-Type header match an entry in the allowed types list (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG). Files where extension and Content-Type are mismatched or either is not in the allowed list shall be rejected with 400.

**Validates: Requirements 2.3, 2.4, 7.1, 7.7**

### Property 6: File Storage Path Traversal Prevention

*For any* uploaded file with any original filename (including strings containing `../`, `..\\`, absolute paths, null bytes, or other path traversal sequences), the stored filename shall be a system-generated UUID with the original file's extension, and the resulting storage path shall always resolve to within the configured upload directory.

**Validates: Requirements 7.3**

### Property 7: Rate Limiter Sliding Window Enforcement

*For any* IP address and form type combination, if 5 requests have been recorded within the current 60-second sliding window, the next request shall be rejected with HTTP 429 status and a `Retry-After` header containing a positive integer representing the whole seconds until the oldest request exits the window.

**Validates: Requirements 8.2, 8.3**

### Property 8: Newsletter Subscription Idempotence

*For any* valid email address, submitting a newsletter subscription request N times (where N ≥ 1) shall result in exactly one record in the database for that email, and every submission shall return a success response regardless of whether the email was previously subscribed.

**Validates: Requirements 4.3**

### Property 9: Newsletter Unsubscribe Token Handling

*For any* active newsletter subscription, accessing the unsubscribe endpoint with that subscription's token shall change the status to "unsubscribed". *For any* UUID that does not correspond to an existing subscription's unsubscribe_token, the endpoint shall return an error response indicating the token is invalid.

**Validates: Requirements 4.7, 4.8**

### Property 10: API Response Structure Invariant

*For any* API response returned by any form endpoint, if the operation succeeded the response body shall match `{ success: true, data?: object }`, and if the operation failed the response body shall match `{ success: false, error: { code: string, message: string, fields?: Record<string, string> } }` where message does not exceed 256 characters.

**Validates: Requirements 10.1, 10.2**

### Property 11: Server Error Information Hiding

*For any* internal server error (500/503), the response body shall not contain stack traces, internal file paths, database table names, or third-party service identifiers. The error message shall be a fixed non-descriptive string.

**Validates: Requirements 10.3**

### Property 12: Request ID Propagation

*For any* single API request that generates multiple log entries (validation, persistence, email notification phases), all log entries shall contain the same UUID v4 request ID, a valid ISO 8601 timestamp, the correct log level, and the form type.

**Validates: Requirements 10.4, 10.6**

### Property 13: Email Routing Correctness

*For any* successful form submission, the Email_Service shall route the team notification to the correct recipient based on form type: LP interest and investor contact forms route to the IR team, developer forms route to the development team, and general contact forms route to the support team.

**Validates: Requirements 6.2**

### Property 14: Email Notification Content Completeness

*For any* successful form submission, the team notification email body shall contain every user-submitted field value formatted with its labeled field name. No submitted field value shall be omitted from the notification.

**Validates: Requirements 6.3**

## Error Handling

### 错误分类与响应策略

| 错误类别 | HTTP 状态码 | 错误码 | 处理策略 |
|---------|------------|--------|---------|
| 输入验证失败 | 400 | `VALIDATION_ERROR` | 返回字段级错误信息 |
| 文件类型不允许 | 400 | `INVALID_FILE_TYPE` | 返回允许的文件类型列表 |
| 文件数量超限 | 400 | `TOO_MANY_FILES` | 返回最大文件数 |
| 文件过大 | 413 | `FILE_TOO_LARGE` | 返回大小限制 |
| Content-Type 错误 | 415 | `UNSUPPORTED_MEDIA_TYPE` | 返回支持的 Content-Type |
| 频率限制 | 429 | `RATE_LIMITED` | 返回 Retry-After 头 |
| HTTP 方法不允许 | 405 | `METHOD_NOT_ALLOWED` | 返回 Allow 头 |
| 数据库不可用 | 503 | `SERVICE_UNAVAILABLE` | 固定消息，不暴露内部信息 |
| 内部服务器错误 | 500 | `INTERNAL_ERROR` | 固定消息，记录详细日志 |

### 错误响应格式

```typescript
// 统一错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;       // 机器可读的错误分类码
    message: string;    // 人类可读的描述（≤256字符）
    fields?: Record<string, string>;  // 字段级错误（仅验证错误时）
  };
}

// 示例
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "表单验证失败，请检查标记的字段",
    "fields": {
      "email": "邮箱格式不正确",
      "name": "姓名为必填项"
    }
  }
}
```

### 数据库错误重试策略

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  requestId: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isTransientError(error)) {
      logger.warn({ requestId, error: error.message }, "Transient DB error, retrying in 500ms");
      await sleep(500);
      return await operation(); // 单次重试
    }
    throw error; // 非瞬态错误直接抛出
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    return code === "ECONNRESET" || code === "ETIMEDOUT" || code === "57P01";
  }
  return false;
}
```

### 邮件失败处理

```typescript
async function sendWithRetry(
  sendFn: () => Promise<void>,
  requestId: string,
  maxRetries = 3
): Promise<boolean> {
  let delay = 1000; // 起始 1s
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendFn();
      return true;
    } catch (error) {
      logger.error({ requestId, attempt, error: error.message }, "Email send failed");
      if (attempt < maxRetries) {
        await sleep(delay);
        delay *= 2; // 指数退避: 1s → 2s → 4s
      }
    }
  }
  return false; // 所有重试均失败
}
```

### Redis 降级策略

```typescript
async function withCacheFallback<T>(
  cacheOperation: () => Promise<T>,
  fallback: T,
  requestId: string
): Promise<T> {
  if (!isRedisAvailable()) {
    logger.warn({ requestId }, "Redis unavailable, bypassing cache/rate-limit");
    return fallback;
  }
  try {
    return await cacheOperation();
  } catch (error) {
    logger.warn({ requestId, error: error.message }, "Redis operation failed, using fallback");
    return fallback;
  }
}
```

## Testing Strategy

### 测试框架与工具

| 工具 | 用途 |
|------|------|
| Vitest | 单元测试和集成测试运行器 |
| fast-check | 属性基测试（Property-Based Testing） |
| msw (Mock Service Worker) | HTTP 请求模拟 |
| testcontainers | PostgreSQL/Redis 集成测试容器 |

### 双重测试方法

**单元测试**用于：
- 特定边界条件验证（文件大小恰好 10MB、空字符串、5 个文件上限）
- 错误场景（数据库连接失败、邮件发送失败）
- 组件间集成点（FormService 调用 EmailService）
- 特定配置验证（SMTP 环境变量读取）

**属性测试**用于：
- 验证跨所有有效输入空间的通用属性
- 表单数据持久化 round-trip
- 输入验证对所有无效输入的正确拒绝
- 安全属性（sanitization、path traversal prevention、信息隐藏）
- 限流算法的正确性

### 属性测试配置

- 每个属性测试最少运行 **100 次迭代**
- 使用 fast-check 作为 PBT 库
- 每个测试标注对应的设计属性编号

标签格式：`Feature: backend-infrastructure, Property {number}: {property_text}`

### 测试目录结构

```
test/
├── unit/
│   ├── validation/
│   │   ├── lp-interest.test.ts
│   │   ├── developer.test.ts
│   │   ├── contact.test.ts
│   │   └── newsletter.test.ts
│   ├── sanitizer.test.ts
│   ├── rate-limiter.test.ts
│   ├── file-storage.test.ts
│   └── email-service.test.ts
├── property/
│   ├── form-roundtrip.property.ts
│   ├── validation-rejection.property.ts
│   ├── sanitization.property.ts
│   ├── file-validation.property.ts
│   ├── rate-limiter.property.ts
│   ├── response-structure.property.ts
│   └── security.property.ts
└── integration/
    ├── api-endpoints.test.ts
    ├── database.test.ts
    └── email-notification.test.ts
```

### 关键测试场景

| 属性编号 | 测试文件 | 生成器描述 |
|---------|---------|-----------|
| P1 | form-roundtrip.property.ts | 生成随机有效表单数据（中英文名称、有效邮箱、随机枚举值） |
| P2 | validation-rejection.property.ts | 生成含 1-N 个验证错误的表单数据 |
| P3 | sanitization.property.ts | 生成含随机 HTML/JS 注入的字符串 |
| P5 | file-validation.property.ts | 生成随机 MIME type + extension 组合 |
| P6 | file-validation.property.ts | 生成含路径遍历字符的文件名 |
| P7 | rate-limiter.property.ts | 生成随机 IP 的请求序列（长度 1-20） |
| P10 | response-structure.property.ts | 生成各种成功/失败场景，验证响应格式 |

### 集成测试策略

- 使用 testcontainers 启动临时 PostgreSQL 和 Redis 实例
- 完整的 API 端到端流程测试（请求 → 验证 → 持久化 → 响应）
- 邮件服务使用 mock SMTP 服务器验证邮件内容
- 文件上传使用临时目录，测试后清理
