# Requirements Document

## Introduction

本文档定义了 Inspira Energy 新加坡新能源基金投资平台官网后端基础设施的需求。当前平台已完成前端开发（Next.js 16 + React 19），包含 LP 投资意向表单、开发商路条提交表单、联系咨询表单和 Newsletter 订阅表单，但所有表单仅在前端执行 `setSubmitted(true)`，数据未持久化。本后端基础设施将实现 API 端点、PostgreSQL 数据持久化、Redis 缓存、邮件通知和文件上传功能。

## Glossary

- **API_Router**: Next.js App Router 中的 API Route Handler，处理 HTTP 请求并返回响应
- **Form_Service**: 负责接收、验证和处理表单提交数据的后端服务层
- **Database_Layer**: 基于 PostgreSQL 的数据持久化层，负责数据的 CRUD 操作
- **Email_Service**: 负责发送邮件通知的服务模块，包括团队通知邮件和提交者确认邮件
- **File_Storage**: 负责接收、验证和存储上传文件的服务模块
- **Cache_Layer**: 基于 Redis 的缓存层，用于缓存热数据和控制请求频率
- **Rate_Limiter**: 基于 Redis 的请求频率限制器，防止恶意或过量请求
- **LP_Form**: LP（Limited Partner）投资意向表单，收集机构投资者的投资意向信息
- **Developer_Form**: 开发商路条提交表单，收集新能源项目开发商的项目信息和相关文件
- **Contact_Form**: 联系咨询表单，包含投资者咨询和通用咨询两种模式
- **Newsletter_Form**: Newsletter 邮件订阅表单，收集订阅者邮箱地址
- **Submission**: 一次完整的表单提交记录，包含提交数据、时间戳和处理状态

## Requirements

### Requirement 1: LP 投资意向表单 API

**User Story:** As a LP 机构投资者, I want 通过网站提交投资意向表单, so that Inspira 团队能收到我的投资需求并跟进联系。

#### Acceptance Criteria

1. WHEN the LP_Form receives a submission with all required fields (name, institution, email) populated and at least one fund_type value selected from the predefined set, THE API_Router SHALL persist the submission to the Database_Layer and return a success response within 3 seconds
2. IF the LP_Form submission is missing any required field (name, institution, email) or all fields are empty strings, THEN THE Form_Service SHALL return a 400 status code with an error response identifying each missing or empty required field
3. IF the LP_Form submission contains an email that does not conform to RFC 5322 format or exceeds 254 characters, THEN THE Form_Service SHALL return a 400 status code with an error response indicating the email format is invalid
4. WHEN the LP_Form submission is successfully persisted, THE Email_Service SHALL send a notification email to the Inspira investor relations team containing all submitted fields
5. WHEN the LP_Form submission is successfully persisted, THE Email_Service SHALL send a confirmation email to the submitter's email address acknowledging receipt
6. THE Database_Layer SHALL store LP_Form submissions with the following fields: id (auto-generated UUID), name (required, max 100 characters), institution (required, max 200 characters), position (optional, max 100 characters), email (required, max 254 characters), phone (optional, max 20 characters), fund_types (required, one or more values from the predefined fund type list), regions (optional, zero or more values from the predefined region list), investment_size (optional, free-text max 50 characters), created_at (auto-generated UTC timestamp), status (enum: pending | contacted | closed, default: pending)
7. IF the Database_Layer fails to persist the LP_Form submission, THEN THE API_Router SHALL return a 500 status code with an error response indicating a server error, and SHALL NOT trigger any notification or confirmation emails
8. IF the Email_Service fails to send the notification or confirmation email after a successful persistence, THEN THE API_Router SHALL still return a success response to the submitter and the submission SHALL remain persisted in the Database_Layer
9. IF the LP_Form submission contains a fund_type value not present in the predefined fund type list, THEN THE Form_Service SHALL return a 400 status code with an error response indicating the invalid fund type selection

### Requirement 2: 开发商路条提交表单 API

**User Story:** As a 新能源项目开发商, I want 通过网站提交项目路条信息和相关文件, so that Inspira 团队能评估我的项目并与我联系合作事宜。

#### Acceptance Criteria

1. WHEN the Developer_Form receives a submission with all required fields (company_name, contact_name, email, region, project_type, capacity_mw) where email matches standard email format and capacity_mw is a numeric value between 0.1 and 10000, THE API_Router SHALL persist the submission to the Database_Layer and return a success response within 5 seconds
2. IF the Developer_Form submission is missing one or more required fields or contains invalid values, THEN THE Form_Service SHALL reject the submission with a 400 status code and return field-specific error messages indicating which fields failed validation
3. WHEN the Developer_Form submission includes file attachments with types limited to PDF, DOC, DOCX, XLS, XLSX, JPG, and PNG, THE File_Storage SHALL accept and store the files
4. IF the Developer_Form submission includes a file with a type not in the allowed list (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG), THEN THE File_Storage SHALL reject the file and return a 400 status code with an error message indicating the accepted file types
5. IF the Developer_Form submission includes a file larger than 10MB, THEN THE File_Storage SHALL reject the file and return a 413 status code with an error message indicating the 10MB size limit
6. IF the Developer_Form submission includes more than 5 file attachments, THEN THE File_Storage SHALL reject the upload and return a 400 status code with an error message indicating the maximum of 5 files per submission
7. WHEN the Developer_Form submission is successfully persisted, THE Email_Service SHALL send a notification email to the Inspira development team containing company_name, contact_name, project_type, region, capacity_mw, and file attachment links
8. WHEN the Developer_Form submission is successfully persisted, THE Email_Service SHALL send a confirmation email to the submitter acknowledging receipt and stating that the team will respond within 5 business days
9. IF the Database_Layer fails to persist a Developer_Form submission, THEN THE API_Router SHALL return a 500 status code with an error message indicating submission failure, and SHALL NOT trigger notification or confirmation emails
10. THE Database_Layer SHALL store Developer_Form submissions with: id, company_name, contact_name, email, region, project_type, capacity_mw, project_stage, expected_construction_date, notes, file_paths, created_at, status (with status initialized to "pending")
11. IF the Email_Service fails to send notification or confirmation emails after successful persistence, THEN THE API_Router SHALL still return a success response to the submitter and log the email delivery failure for retry

### Requirement 3: 联系咨询表单 API

**User Story:** As a 网站访客, I want 通过联系表单向 Inspira 发送咨询, so that 我能获得关于投资或其他事项的专业回复。

#### Acceptance Criteria

1. WHEN the Contact_Form receives an investor inquiry where name (1-100 characters), company (1-200 characters), and email (valid RFC 5322 format, max 254 characters) are provided, THE API_Router SHALL persist the submission to the Database_Layer and return a success response within 3 seconds
2. WHEN the Contact_Form receives a general inquiry where name (1-100 characters), email (valid RFC 5322 format, max 254 characters), and message (1-5000 characters) are provided, THE API_Router SHALL persist the submission to the Database_Layer and return a success response within 3 seconds
3. IF the Contact_Form submission is missing required fields (investor inquiry: name, company, email; general inquiry: name, email, message) or any field fails format validation, THEN THE Form_Service SHALL return a 400 status code with field-specific error messages indicating which fields failed and why
4. WHEN the Contact_Form investor inquiry is successfully persisted, THE Email_Service SHALL send a notification email to the Inspira investor relations team within 30 seconds
5. WHEN the Contact_Form general inquiry is successfully persisted, THE Email_Service SHALL send a notification email to the Inspira general support team within 30 seconds
6. WHEN any Contact_Form inquiry is successfully persisted, THE Email_Service SHALL send a confirmation email to the submitter's email address within 30 seconds
7. THE Database_Layer SHALL store Contact_Form submissions with: id, form_type (investor/general), name, company, position, email, phone, fund_types, regions, investment_size, subject, message (max 5000 characters), created_at, status (initial value: "pending")
8. IF the Email_Service fails to send a notification or confirmation email, THEN THE System SHALL retain the persisted submission unchanged and log the failure for retry, without returning an error to the submitter
9. IF the Contact_Form receives more than 5 submissions from the same email address within a 10-minute window, THEN THE Form_Service SHALL reject the submission and return a rate-limit error response

### Requirement 4: Newsletter 订阅 API

**User Story:** As a 网站访客, I want 订阅 Inspira 的 Newsletter, so that 我能定期收到新能源投资行业洞察。

#### Acceptance Criteria

1. WHEN the Newsletter_Form receives an email address that conforms to RFC 5322 format and does not exceed 254 characters in length, THE API_Router SHALL persist the subscription to the Database_Layer and return a success response within 2 seconds
2. IF the Newsletter_Form receives an email that does not conform to RFC 5322 format or exceeds 254 characters, THEN THE Form_Service SHALL reject the request with a 400 status code and return an error message indicating the email format is invalid
3. WHEN the Newsletter_Form receives an email that already exists in the subscription list, THE API_Router SHALL return a success response without creating a duplicate record
4. WHEN a new subscription is successfully created, THE Email_Service SHALL send a welcome email to the subscriber within 60 seconds confirming the subscription
5. IF the Email_Service fails to send the welcome email, THEN THE API_Router SHALL retain the subscription record in the Database_Layer and log the delivery failure for retry
6. THE Database_Layer SHALL store Newsletter subscriptions with: id, email, subscribed_at, status (active, unsubscribed), unsubscribe_token
7. WHEN a subscriber accesses the unsubscribe endpoint with a valid unsubscribe_token, THE API_Router SHALL update the subscription status to "unsubscribed" and return a confirmation response within 2 seconds
8. IF a subscriber accesses the unsubscribe endpoint with an invalid or expired unsubscribe_token, THEN THE API_Router SHALL return an error response indicating the token is invalid

### Requirement 5: 数据持久化层

**User Story:** As a 系统管理员, I want 所有表单数据持久化存储到 PostgreSQL, so that 业务数据不会丢失且可以后续查询分析。

#### Acceptance Criteria

1. THE Database_Layer SHALL connect to a PostgreSQL instance installed on the G drive with a connection timeout of 5 seconds
2. THE Database_Layer SHALL use connection pooling with a minimum of 2 idle connections and a maximum of 20 concurrent connections, with an idle connection timeout of 30 seconds
3. THE Database_Layer SHALL apply database migrations to create and update table schemas
4. IF a database write operation fails due to a transient error (network timeout or connection loss), THEN THE Database_Layer SHALL retry the operation once after a 500ms delay before returning an error to the caller
5. THE Database_Layer SHALL use parameterized queries for all database operations to prevent SQL injection
6. THE Database_Layer SHALL record a created_at timestamp in UTC for every new record
7. IF the Database_Layer fails to establish a connection to PostgreSQL within 5 seconds, THEN THE Database_Layer SHALL return an error indicating the database is unavailable and SHALL NOT queue or discard the pending operation
8. IF a database read operation fails, THEN THE Database_Layer SHALL return an error to the caller indicating the nature of the failure (connection error or query error) without retrying
9. IF a database write operation fails due to a non-transient error (constraint violation or invalid data), THEN THE Database_Layer SHALL immediately return the error to the caller without retrying

### Requirement 6: 邮件通知服务

**User Story:** As a Inspira 团队成员, I want 在收到表单提交时自动收到邮件通知, so that 我能及时跟进潜在客户和合作伙伴。

#### Acceptance Criteria

1. THE Email_Service SHALL support configurable SMTP settings (host, port, authentication credentials, sender address) through environment variables
2. WHEN sending a notification email to the team, THE Email_Service SHALL route the notification to the corresponding team recipient based on form type: investor relations team for LP/investor forms, development team for developer forms, and general support team for general inquiry forms
3. WHEN sending a notification email to the team, THE Email_Service SHALL include all submitted form fields formatted in a structured HTML template with labeled field names and corresponding values
4. WHEN sending a confirmation email to a submitter, THE Email_Service SHALL use the submitter's preferred language (Chinese or English) based on the locale of the page from which the form was submitted
5. IF an email send operation fails, THEN THE Email_Service SHALL log the failure with error details and retry up to 3 times with exponential backoff starting at 1 second delay and doubling each attempt (1s, 2s, 4s)
6. IF all email retry attempts fail, THEN THE Email_Service SHALL mark the submission record with an email_failed status without affecting the form submission success response
7. THE Email_Service SHALL process email sending asynchronously so that the form submission response is returned to the user without waiting for email delivery to complete
8. THE Email_Service SHALL include an unsubscribe link in all Newsletter emails

### Requirement 7: 文件上传服务

**User Story:** As a 开发商, I want 上传项目相关文件（可研报告、许可证等）, so that Inspira 能全面了解我的项目情况。

#### Acceptance Criteria

1. WHEN a file upload request is received, THE File_Storage SHALL validate the file MIME type by checking both the file extension and the Content-Type header against the allowed list (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG)
2. WHEN a file upload request is received, THE File_Storage SHALL validate that the file size does not exceed 10MB per file
3. WHEN a valid file is received, THE File_Storage SHALL store the file on the local filesystem with a unique generated filename to prevent path traversal attacks
4. WHEN a file is successfully stored, THE File_Storage SHALL return the stored file path and metadata (original filename, size, MIME type)
5. THE File_Storage SHALL store uploaded files in a configurable directory on the G drive
6. IF a file upload fails due to disk space or I/O error, THEN THE File_Storage SHALL return a 500 status code with an error message indicating the cause of failure
7. IF the file MIME type or extension is not in the allowed list, THEN THE File_Storage SHALL reject the upload and return a 400 status code with an error message indicating the unsupported file type
8. IF the file size exceeds 10MB, THEN THE File_Storage SHALL reject the upload and return a 400 status code with an error message indicating the size limit exceeded
9. WHEN a file upload request is received, THE File_Storage SHALL validate that the number of files in the request does not exceed 5 per submission

### Requirement 8: Redis 缓存层

**User Story:** As a 系统运维人员, I want 使用 Redis 缓存热数据并进行请求频率控制, so that 系统性能得到优化且不被恶意请求攻击。

#### Acceptance Criteria

1. THE Cache_Layer SHALL connect to a Redis instance installed on the G drive with a connection timeout of 5 seconds
2. THE Rate_Limiter SHALL limit each IP address to a maximum of 5 form submissions per 60-second sliding window per form type, where the IP address is determined from the leftmost untrusted address in the X-Forwarded-For header chain or the direct connection IP if no proxy header is present
3. WHEN a request exceeds the rate limit, THE Rate_Limiter SHALL return a 429 status code with a Retry-After header containing the number of whole seconds remaining until the current window expires
4. THE Cache_Layer SHALL cache Newsletter subscription email lookups with a TTL of 1 hour; WHEN a cache hit occurs for a previously seen email, THE Cache_Layer SHALL return the cached duplicate status without querying PostgreSQL
5. IF the Redis connection fails to respond within 5 seconds or the connection is refused, THEN THE Cache_Layer SHALL allow requests to proceed without caching, bypass rate limiting, and log a warning-level entry to the application log
6. IF Redis becomes available again after a prior connection failure, THEN THE Cache_Layer SHALL resume caching and rate limiting with a fresh sliding window (no prior rate-limit state is preserved)

### Requirement 9: API 安全与输入验证

**User Story:** As a 平台安全负责人, I want 所有 API 端点具备输入验证和安全防护, so that 平台免受注入攻击和恶意数据提交。

#### Acceptance Criteria

1. IF a string input exceeds 1000 characters for a single-line field or 5000 characters for a multi-line field, THEN THE Form_Service SHALL reject the request with HTTP 400 status and an error message indicating which field exceeded the allowed length
2. THE Form_Service SHALL sanitize all text inputs by encoding HTML entities and removing script tags and event handler attributes before persisting to the database
3. WHEN a non-POST HTTP request is received on a form submission endpoint, THE API_Router SHALL return HTTP 405 status with an Allow header specifying POST as the permitted method
4. IF a request is received without a Content-Type header of application/json or multipart/form-data, THEN THE API_Router SHALL reject the request with HTTP 415 status and an error message indicating the accepted content types
5. THE API_Router SHALL include CORS headers restricting access to the platform's own domain and SHALL respond to OPTIONS preflight requests with appropriate CORS headers without processing the request body
6. WHEN a request fails validation, THE Form_Service SHALL log the validation failure including client IP address, request path, HTTP method, the specific validation rule that failed, and a timestamp, for security monitoring

### Requirement 10: 错误处理与日志

**User Story:** As a 开发者, I want 统一的错误处理和结构化日志, so that 问题能被快速定位和修复。

#### Acceptance Criteria

1. THE API_Router SHALL return consistent JSON error responses with structure: { success: false, error: { code, message, fields? } } where code is a string identifier for the error category and message is a human-readable description not exceeding 256 characters
2. THE API_Router SHALL return consistent JSON success responses with structure: { success: true, data?: object }
3. WHEN an unexpected server error occurs, THE API_Router SHALL return a 500 status code with a fixed non-descriptive error message, excluding stack traces, internal file paths, database table names, and third-party service identifiers from the response body
4. THE Form_Service SHALL log all form submissions as structured JSON entries including: a UUID v4 request ID, an ISO 8601 timestamp, a log level (info for success, error for failure), form type, and processing result (one of: success, validation_failed, persistence_failed, email_failed)
5. IF a database connection fails, THEN THE API_Router SHALL return a 503 status code indicating service temporarily unavailable
6. WHEN processing a request, THE Form_Service SHALL propagate the same request ID across all log entries generated during that request's lifecycle (validation, persistence, email notification) to enable end-to-end tracing
