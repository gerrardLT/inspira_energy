# Implementation Plan: 后端运营管理功能

## Overview

基于 Next.js 16 App Router + Drizzle ORM + ioredis 现有架构，增量实现后端运营管理功能的七个核心模块。实现按依赖顺序推进：基础类型与 Schema 迁移 → 文件存储抽象层 → API Key 认证中间件 → 健康检查端点 → 文件下载 API → 提交查询 API → 状态更新 API + Webhook 通知集成。

## Tasks

- [x] 1. 基础设施：类型定义、错误码扩展和数据库 Schema 迁移
  - [x] 1.1 扩展 API 类型定义和错误码常量
    - 在 `src/types/api.ts` 中新增 `UNAUTHORIZED`、`NOT_FOUND`、`SERVICE_NOT_CONFIGURED` 错误码
    - 定义 `AdminFormType`、`SubmissionStatus`、`PaginatedResult<T>` 等共享类型
    - 定义 `StorageBackendType`、`StorageErrorCode` 类型
    - _Requirements: 2.2, 3.2, 6.7_

  - [x] 1.2 创建数据库 Schema 迁移：为提交表添加 `updated_at` 字段
    - 在 Drizzle Schema 中为 `lpInterestSubmissions`、`developerSubmissions`、`contactSubmissions` 表添加 `updatedAt` 列
    - 生成并执行对应的 SQL 迁移脚本
    - _Requirements: 3.1, 3.5_

  - [x] 1.3 扩展环境变量类型声明和配置验证
    - 添加 `ADMIN_API_KEY`、`STORAGE_BACKEND`、`S3_*`、`WEBHOOK_URL`、`WEBHOOK_PLATFORM` 环境变量声明
    - 更新 `.env.example` 文件包含所有新增环境变量及注释
    - _Requirements: 6.2, 6.4, 7.1, 5.2_

- [x] 2. 文件存储抽象层
  - [x] 2.1 实现存储适配器接口和工厂函数
    - 创建 `src/lib/storage/adapter.ts`，定义 `IStorageBackend` 接口和 `StorageError` 类
    - 实现 `createStorageAdapter()` 工厂函数，根据 `STORAGE_BACKEND` 环境变量选择后端
    - 未知值回退到 "local" 并发出 warn 日志
    - 实现 `getStorageAdapter()` 单例获取函数
    - _Requirements: 6.1, 6.2, 6.5, 6.7_

  - [x] 2.2 实现本地文件系统存储后端
    - 创建 `src/lib/storage/local-backend.ts`，实现 `IStorageBackend` 接口
    - 支持 store（UUID 文件名生成）、retrieve（ReadableStream）、exists、delete 操作
    - 实现 `healthCheck()` 方法验证目录可访问性
    - 错误封装为 `StorageError`，不暴露内部路径
    - _Requirements: 6.1, 6.3, 6.6, 6.7, 6.8_

  - [x] 2.3 实现 S3 兼容对象存储后端
    - 创建 `src/lib/storage/s3-backend.ts`，使用 `@aws-sdk/client-s3` 实现 `IStorageBackend` 接口
    - 从环境变量读取 S3_ENDPOINT、S3_BUCKET、S3_ACCESS_KEY、S3_SECRET_KEY、S3_REGION
    - 支持 store（PutObject）、retrieve（GetObject → ReadableStream）、exists（HeadObject）、delete（DeleteObject）
    - 实现 `healthCheck()` 方法验证 Bucket 可访问
    - _Requirements: 6.1, 6.4, 6.6, 6.7, 6.8_

  - [x]* 2.4 编写存储适配器属性测试
    - **Property 13: 存储后端回退行为** — 验证无效 STORAGE_BACKEND 值回退到 local
    - **Property 14: 存储操作 Round-Trip** — 验证 store → retrieve 返回相同字节数据
    - **Property 15: 存储错误封装** — 验证错误携带枚举化 errorCode 且不暴露内部细节
    - **Validates: Requirements 6.5, 6.6, 6.7**

- [x] 3. Checkpoint - 存储层验证
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. API Key 认证中间件
  - [x] 4.1 实现 `apiKeyGuardMiddleware` 认证中间件
    - 创建 `src/lib/admin/auth-guard.ts`
    - 从 `X-API-Key` 请求头获取 key 值
    - 使用 `crypto.timingSafeEqual` 进行常量时间比较
    - `ADMIN_API_KEY` 未配置时返回 503（SERVICE_NOT_CONFIGURED）
    - 认证失败记录 warn 日志（clientIp + requestPath + timestamp）
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.2 创建管理 API 中间件管道 `createAdminMiddlewarePipeline`
    - 在 `src/lib/admin/auth-guard.ts` 中导出管道组合函数
    - 执行顺序：requestIdMiddleware → clientIpMiddleware → apiKeyGuardMiddleware
    - 复用现有 `composeMiddleware` 模式
    - _Requirements: 7.1, 7.2_

  - [x]* 4.3 编写 API Key 认证属性测试
    - **Property 16: 常量时间比较函数正确性** — 验证比较函数返回 true 当且仅当两字符串完全相等
    - **Property 17: 认证失败信息不泄漏** — 验证所有无效 key 返回相同错误码和消息
    - **Property 18: 认证失败日志完整性** — 验证 warn 日志包含 clientIp、requestPath、timestamp
    - **Validates: Requirements 7.1, 7.3, 7.4**

- [x] 5. 健康检查端点
  - [x] 5.1 实现健康检查服务 `HealthService`
    - 创建 `src/lib/health/index.ts`
    - PostgreSQL 检查：`SELECT 1`，3 秒超时
    - Redis 检查：`PING`，2 秒超时
    - 两项检查并行执行（Promise.allSettled）
    - version 从 package.json 读取
    - 整体状态聚合：全部 healthy → "healthy"(200)，任一 unhealthy → "degraded"(503)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_

  - [x] 5.2 创建健康检查 Route Handler
    - 创建 `src/app/api/health/route.ts`，实现 GET 方法
    - 无需 API Key 认证
    - 返回 JSON 格式健康状态响应
    - _Requirements: 4.1, 4.7_

  - [x]* 5.3 编写健康检查属性测试
    - **Property 11: 健康状态聚合逻辑** — 验证组件状态组合与整体状态/HTTP 状态码的映射关系
    - **Validates: Requirements 4.4, 4.5**

- [x] 6. 文件下载 API
  - [x] 6.1 实现文件下载服务 `DownloadService`
    - 创建 `src/lib/admin/download-service.ts`
    - 验证 fileId 在 developer_submissions.filePaths JSONB 中存在
    - 通过 StorageAdapter 获取文件流
    - 生成正确的 Content-Type 和 Content-Disposition（RFC 5987 URL 编码）响应头
    - 错误处理：不存在返回 404，I/O 错误返回 500（不暴露内部路径）
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [x] 6.2 创建文件下载 Route Handler
    - 创建 `src/app/api/admin/files/[fileId]/route.ts`，实现 GET 方法
    - 使用 `createAdminMiddlewarePipeline` 进行认证
    - 返回二进制流 + 正确的 HTTP 响应头
    - _Requirements: 1.1, 1.2_

  - [x]* 6.3 编写文件下载属性测试
    - **Property 1: 文件下载响应头格式正确性** — 验证 Content-Type 和 Content-Disposition 格式
    - **Property 2: 错误响应不泄漏内部细节** — 验证错误消息不包含内部路径
    - **Validates: Requirements 1.1, 1.4, 1.5**

- [x] 7. Checkpoint - 认证与下载验证
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. 提交查询 API
  - [x] 8.1 实现提交查询服务 `QueryService`
    - 创建 `src/lib/admin/query-service.ts`
    - 实现 formType 映射到对应 Drizzle 表的逻辑
    - 实现状态筛选、日期范围筛选、邮箱子串匹配、跨字段搜索
    - 实现 OFFSET/LIMIT 分页逻辑，结果按 created_at DESC 排序
    - 使用 Zod schema 验证查询参数
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10_

  - [x] 8.2 创建提交查询 Route Handler
    - 创建 `src/app/api/admin/submissions/[formType]/route.ts`，实现 GET 方法
    - 使用 `createAdminMiddlewarePipeline` 进行认证
    - formType 验证：不在允许列表内返回 400
    - 解析查询参数并调用 QueryService
    - _Requirements: 2.1, 2.2, 2.9_

  - [x]* 8.3 编写提交查询属性测试
    - **Property 3: 无效 formType 验证** — 验证非法 formType 返回 400
    - **Property 4: 状态筛选正确性** — 验证筛选结果所有记录状态匹配筛选值
    - **Property 5: 日期范围筛选正确性** — 验证筛选结果 created_at 在范围内
    - **Property 6: 邮箱筛选大小写不敏感子串匹配** — 验证邮箱匹配逻辑
    - **Property 7: 跨字段搜索正确性** — 验证至少一个目标字段包含搜索词
    - **Property 8: 分页切片与元数据正确性** — 验证 totalPages 计算和边界情况
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10**

- [x] 9. 提交状态更新 API 与 Webhook 通知
  - [x] 9.1 实现 Webhook 消息格式化器
    - 创建 `src/lib/webhook/formatters.ts`
    - 实现 WeChat Work（markdown card）、Feishu（interactive card）、Slack（Block Kit）三种格式化器
    - 格式化消息包含所有必需字段：formType、name、email、timestamp、summary
    - _Requirements: 5.3, 5.4_

  - [x] 9.2 实现 Webhook 通知服务 `WebhookService`
    - 创建 `src/lib/webhook/index.ts`
    - 实现异步发射不等待（fire-and-forget）模式
    - 失败重试 2 次，固定 3 秒间隔，超时 10 秒
    - WEBHOOK_URL 未配置时静默跳过
    - 所有尝试失败后记录 error 日志但不影响业务流程
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8_

  - [x] 9.3 实现提交状态更新服务 `StatusService`
    - 创建 `src/lib/admin/status-service.ts`
    - 使用 Zod 验证 status 值合法性
    - 查询提交记录是否存在，不存在返回 404
    - 更新 status + updated_at，使用 Drizzle `returning()` 获取更新后记录
    - 状态更新成功后触发 WebhookService 异步通知
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  - [x] 9.4 创建状态更新 Route Handler
    - 创建 `src/app/api/admin/submissions/[formType]/[submissionId]/route.ts`，实现 PATCH 方法
    - 使用 `createAdminMiddlewarePipeline` 进行认证
    - 验证 formType 合法性和请求体 status 值
    - _Requirements: 3.1, 3.4_

  - [x]* 9.5 编写状态更新与 Webhook 属性测试
    - **Property 9: 状态更新持久化正确性** — 验证更新后记录反映新状态和有效 updated_at
    - **Property 10: 无效状态值验证** — 验证非法状态值返回 400 且列出允许值
    - **Property 12: Webhook 消息格式化完整性** — 验证格式化消息包含所有必需字段且符合平台规范
    - **Validates: Requirements 3.1, 3.2, 3.5, 5.3, 5.4**

- [x] 10. Final checkpoint - 全部功能验证
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- 所有管理 API 复用现有 `composeMiddleware` 中间件组合模式和统一响应格式
- 文件存储抽象层采用策略模式，支持运行时通过环境变量切换后端
- Webhook 通知采用 fire-and-forget 模式，不阻塞主业务流程

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.2"] },
    { "id": 3, "tasks": ["2.4", "4.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "8.1", "9.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "9.2"] },
    { "id": 7, "tasks": ["9.3"] },
    { "id": 8, "tasks": ["9.4", "9.5"] }
  ]
}
```
