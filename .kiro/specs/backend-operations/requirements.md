# Requirements Document

## Introduction

本文档定义了 Inspira Energy 新加坡新能源基金投资平台官网后端运营管理功能的需求。当前平台已完成后端基础设施（4 个表单 API、PostgreSQL 持久化、Redis 缓存/限流、邮件通知、文件上传存储），但存在以下生产就绪性缺口：团队成员无法下载已上传文件、无法查询/筛选/分页浏览表单提交记录、无法更新提交状态、缺乏健康检查端点、邮件通知存在延迟且无即时通知渠道、本地文件存储阻碍容器化部署。本文档覆盖文件下载 API、提交查询 API、状态更新 API、健康检查端点、即时通知集成和文件存储抽象层六大功能域。

## Glossary

- **Admin_API**: 面向 Inspira 内部团队成员的管理 API 端点，需要 API Key 认证才能访问
- **API_Key_Guard**: 基于 API Key 的认证中间件，验证请求头中的 `X-API-Key` 值与服务端配置是否匹配
- **Download_Service**: 负责验证文件访问权限并提供文件下载流的服务模块
- **Query_Service**: 负责根据筛选条件查询、分页返回表单提交记录的服务模块
- **Status_Service**: 负责验证和执行提交状态转换的服务模块
- **Health_Endpoint**: 系统健康检查端点，验证 PostgreSQL 和 Redis 连通性并报告系统状态
- **Webhook_Service**: 负责向配置的即时通讯平台（企业微信/飞书/Slack）发送 webhook 通知的服务模块
- **Storage_Adapter**: 文件存储抽象层，支持本地文件系统和 S3 兼容对象存储两种后端实现
- **Submission_Status**: 表单提交的处理状态枚举，包含 pending（待处理）、contacted（已联系）、closed（已关闭）三个值
- **Pagination**: 分页机制，使用 page（页码）和 pageSize（每页条数）参数控制返回结果集大小

## Requirements

### Requirement 1: 文件下载 API

**User Story:** As a Inspira 团队成员, I want 通过管理 API 下载开发商提交的项目文件, so that 我能查阅项目可研报告和许可证等材料进行评估。

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/admin/files/{fileId}` with a valid API Key in the `X-API-Key` header, THE Download_Service SHALL return the requested file as a binary stream with the correct `Content-Type` and `Content-Disposition` headers within 5 seconds
2. IF a GET request to `/api/admin/files/{fileId}` does not include a valid API Key in the `X-API-Key` header, THEN THE API_Key_Guard SHALL return a 401 status code with an error response indicating authentication is required
3. IF a GET request to `/api/admin/files/{fileId}` references a fileId that does not exist in the storage backend, THEN THE Download_Service SHALL return a 404 status code with an error response indicating the file was not found
4. WHEN serving a file download, THE Download_Service SHALL set the `Content-Disposition` header to `attachment` with the original filename (URL-encoded for non-ASCII characters) and set the `Content-Type` header matching the stored MIME type
5. IF the Storage_Adapter encounters an I/O error while reading the file, THEN THE Download_Service SHALL return a 500 status code with an error response indicating a server error, without exposing internal file paths or storage details
6. WHEN a valid file download request is received, THE Download_Service SHALL validate that the fileId corresponds to a file record in the developer_submissions.filePaths metadata before serving the file

### Requirement 2: 提交查询 API

**User Story:** As a Inspira 团队成员, I want 查询和筛选所有表单提交记录, so that 我能按状态、时间、邮箱等条件追踪和管理潜在客户。

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/admin/submissions/{formType}` with a valid API Key, THE Query_Service SHALL return a paginated list of submissions for the specified form type within 3 seconds, where formType is one of: lp-interest, developer, contact, newsletter
2. IF a GET request to `/api/admin/submissions/{formType}` specifies a formType not in the allowed list, THEN THE Query_Service SHALL return a 400 status code with an error response indicating the invalid form type
3. WHEN the request includes a `status` query parameter with a value of pending, contacted, or closed, THE Query_Service SHALL return only submissions matching the specified status
4. WHEN the request includes `startDate` and `endDate` query parameters in ISO 8601 date format, THE Query_Service SHALL return only submissions with created_at timestamps within the specified inclusive date range
5. WHEN the request includes an `email` query parameter, THE Query_Service SHALL return only submissions where the email field contains the specified value as a case-insensitive substring match
6. WHEN the request includes `page` (default: 1, minimum: 1) and `pageSize` (default: 20, minimum: 1, maximum: 100) query parameters, THE Query_Service SHALL return the corresponding page of results ordered by created_at descending
7. THE Query_Service SHALL include pagination metadata in the response: total (total matching records), page (current page number), pageSize (records per page), and totalPages (calculated ceiling of total divided by pageSize)
8. IF the `page` parameter exceeds totalPages, THEN THE Query_Service SHALL return an empty data array with the correct pagination metadata
9. IF a GET request to any `/api/admin/submissions/{formType}` endpoint does not include a valid API Key, THEN THE API_Key_Guard SHALL return a 401 status code with an error response indicating authentication is required
10. WHEN the request includes a `search` query parameter, THE Query_Service SHALL perform a case-insensitive substring match across the name, company/institution, and email fields of the corresponding form type

### Requirement 3: 提交状态更新 API

**User Story:** As a Inspira 团队成员, I want 更新表单提交的处理状态, so that 团队能追踪每条线索的跟进进度。

#### Acceptance Criteria

1. WHEN a PATCH request is received at `/api/admin/submissions/{formType}/{submissionId}` with a valid API Key and a request body containing a valid status value, THE Status_Service SHALL update the submission's status field in the database and return the updated submission record within 2 seconds
2. IF the PATCH request body contains a status value not in the allowed set (pending, contacted, closed), THEN THE Status_Service SHALL return a 400 status code with an error response indicating the invalid status value and listing the allowed values
3. IF the PATCH request references a submissionId that does not exist in the specified form type table, THEN THE Status_Service SHALL return a 404 status code with an error response indicating the submission was not found
4. IF a PATCH request does not include a valid API Key, THEN THE API_Key_Guard SHALL return a 401 status code with an error response indicating authentication is required
5. WHEN the status is successfully updated, THE Status_Service SHALL record an updated_at timestamp in UTC on the submission record
6. IF the database update operation fails, THEN THE Status_Service SHALL return a 500 status code with an error response indicating a server error without exposing internal details

### Requirement 4: 健康检查端点

**User Story:** As a 系统运维人员, I want 通过健康检查端点监控系统各组件状态, so that 我能及时发现和响应服务异常。

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/health`, THE Health_Endpoint SHALL return a JSON response containing the overall system status and individual component statuses within 5 seconds
2. THE Health_Endpoint SHALL verify PostgreSQL connectivity by executing a lightweight query (SELECT 1) and report the database component as "healthy" if the query succeeds within 3 seconds or "unhealthy" with an error description if the query fails or times out
3. THE Health_Endpoint SHALL verify Redis connectivity by executing a PING command and report the cache component as "healthy" if the response is received within 2 seconds or "unhealthy" with an error description if the command fails or times out
4. WHEN all components (PostgreSQL and Redis) report "healthy" status, THE Health_Endpoint SHALL return HTTP 200 with overall status "healthy"
5. IF any component reports "unhealthy" status, THEN THE Health_Endpoint SHALL return HTTP 503 with overall status "degraded" and include the unhealthy component details
6. THE Health_Endpoint SHALL include a response_time field indicating the total health check execution duration in milliseconds
7. THE Health_Endpoint SHALL NOT require API Key authentication, enabling external monitoring tools to poll the endpoint without credentials
8. THE Health_Endpoint SHALL include a `version` field containing the application version string read from the package.json file

### Requirement 5: 即时通知集成

**User Story:** As a Inspira 团队成员, I want 在收到表单提交时通过企业微信或飞书收到即时通知, so that 我能在第一时间响应潜在客户而非等待邮件。

#### Acceptance Criteria

1. WHEN a form submission is successfully persisted and a webhook URL is configured via environment variable, THE Webhook_Service SHALL send a notification message to the configured webhook endpoint within 10 seconds of submission persistence
2. THE Webhook_Service SHALL support three webhook platforms: WeChat Work (企业微信), Feishu (飞书), and Slack, selectable via the `WEBHOOK_PLATFORM` environment variable
3. THE Webhook_Service SHALL format the notification message according to the selected platform's message format specification: markdown card for WeChat Work, interactive card for Feishu, and Block Kit for Slack
4. WHEN sending a webhook notification, THE Webhook_Service SHALL include in the message: form type, submitter name, submitter email, submission timestamp, and a summary of key fields relevant to the form type
5. IF the webhook HTTP request fails (non-2xx response or network timeout of 10 seconds), THEN THE Webhook_Service SHALL retry up to 2 times with a fixed 3-second delay between attempts
6. IF all webhook delivery attempts fail, THEN THE Webhook_Service SHALL log the failure with error details at error level without affecting the form submission success response
7. THE Webhook_Service SHALL process webhook sending asynchronously so that the form submission response is returned to the user without waiting for webhook delivery to complete
8. WHERE the `WEBHOOK_URL` environment variable is not configured or is empty, THE Webhook_Service SHALL skip webhook notification processing without logging an error

### Requirement 6: 文件存储抽象层

**User Story:** As a 系统架构师, I want 文件存储支持本地文件系统和 S3 兼容对象存储两种后端, so that 系统能从本地 G 盘存储平滑迁移到云端对象存储，支持容器化部署。

#### Acceptance Criteria

1. THE Storage_Adapter SHALL provide a unified interface with the following operations: store (save a file and return its identifier), retrieve (get a file stream by identifier), exists (check if a file exists by identifier), and delete (remove a file by identifier)
2. THE Storage_Adapter SHALL support two backend implementations selectable via the `STORAGE_BACKEND` environment variable: "local" for local filesystem storage and "s3" for S3-compatible object storage
3. WHERE the STORAGE_BACKEND is set to "local", THE Storage_Adapter SHALL store files in the directory specified by the `UPLOAD_DIR` environment variable, preserving the existing filename generation and path structure
4. WHERE the STORAGE_BACKEND is set to "s3", THE Storage_Adapter SHALL connect to the S3-compatible service using credentials from environment variables: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_REGION`
5. IF the STORAGE_BACKEND environment variable is not set or contains an unsupported value, THEN THE Storage_Adapter SHALL default to "local" backend and log a warning indicating the fallback
6. WHEN storing a file via the Storage_Adapter, THE Storage_Adapter SHALL return a storage-backend-agnostic file identifier that can be used for subsequent retrieve, exists, and delete operations regardless of the active backend
7. IF the Storage_Adapter encounters an error during any operation (store, retrieve, exists, delete), THEN THE Storage_Adapter SHALL throw a typed error with an error code indicating the failure category (connection_error, not_found, permission_denied, storage_full) without exposing backend-specific details to the caller
8. THE Storage_Adapter SHALL validate that the configured storage backend is accessible during application startup and log the active storage backend type at info level

### Requirement 7: API Key 认证

**User Story:** As a 平台安全负责人, I want 管理 API 端点受 API Key 保护, so that 只有授权的团队成员能访问敏感的提交数据和文件。

#### Acceptance Criteria

1. THE API_Key_Guard SHALL validate the `X-API-Key` request header value against the `ADMIN_API_KEY` environment variable using constant-time string comparison to prevent timing attacks
2. IF the `X-API-Key` header is missing from a request to any Admin_API endpoint, THEN THE API_Key_Guard SHALL return a 401 status code with error code "UNAUTHORIZED" and message indicating that an API key is required
3. IF the `X-API-Key` header value does not match the configured ADMIN_API_KEY, THEN THE API_Key_Guard SHALL return a 401 status code with error code "UNAUTHORIZED" and a message indicating invalid credentials, without revealing whether the key format or value is incorrect
4. WHEN an authentication failure occurs, THE API_Key_Guard SHALL log the failed attempt with the client IP address, request path, and timestamp at warn level for security monitoring
5. IF the `ADMIN_API_KEY` environment variable is not configured or is empty, THEN THE API_Key_Guard SHALL reject all requests to Admin_API endpoints with a 503 status code indicating the service is not properly configured
