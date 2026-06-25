# Implementation Plan: Backend Infrastructure

## Overview

基于 Next.js 16 App Router 的后端基础设施实现，采用分层架构为 4 个前端表单提供完整的 API 端点、PostgreSQL 数据持久化、Redis 缓存与限流、异步邮件通知和文件上传功能。实现语言为 TypeScript。

## Tasks

- [x] 1. Set up project structure, core types, and shared utilities
  - [x] 1.1 Create directory structure and core type definitions
    - Create `src/types/api.ts` with `FormResult`, `ErrorResponse`, `SuccessResponse` interfaces
    - Create `src/lib/errors.ts` with unified error classes (`ValidationError`, `RateLimitError`, `DatabaseError`, `FileStorageError`)
    - Define shared enums and constants (submission status, form types, file constraints, rate limit config)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 1.2 Implement structured logger with pino
    - Create `src/lib/logger.ts` with pino configuration for structured JSON output
    - Implement `LogEntry` interface with requestId, timestamp, level, formType, event, result, details
    - Ensure ISO 8601 timestamps and UUID v4 request ID propagation support
    - _Requirements: 10.4, 10.6_

  - [x] 1.3 Implement middleware composition and request context
    - Create `src/lib/middleware.ts` with `composeMiddleware` function
    - Implement Request ID generation (UUID v4) middleware
    - Implement CORS handler middleware (restrict to configured origin, handle OPTIONS preflight)
    - Implement Content-Type validation middleware (reject non application/json or multipart/form-data with 415)
    - Implement HTTP method enforcement (return 405 with Allow header for non-POST requests)
    - Extract client IP from X-Forwarded-For header (leftmost untrusted) or direct connection
    - _Requirements: 9.3, 9.4, 9.5, 10.6_

- [x] 2. Implement database layer
  - [x] 2.1 Set up PostgreSQL connection pool with Drizzle ORM
    - Create `src/lib/db/index.ts` with pg Pool configuration (min: 2, max: 20, idle timeout: 30s, connection timeout: 5s)
    - Configure connection string from `DATABASE_URL` environment variable
    - Implement connection error handling (return 503 on connection failure)
    - _Requirements: 5.1, 5.2, 5.7_

  - [x] 2.2 Define Drizzle ORM schema for all tables
    - Create `src/lib/db/schema.ts` with pgEnum definitions (submission_status, newsletter_status, contact_form_type)
    - Define `lp_interest_submissions` table with all fields per requirements
    - Define `developer_submissions` table with all fields per requirements
    - Define `contact_submissions` table with all fields per requirements
    - Define `newsletter_subscriptions` table with unique email constraint and unsubscribe_token
    - _Requirements: 1.6, 2.10, 3.7, 4.6_

  - [x] 2.3 Create database migration script
    - Create `src/lib/db/migrate.ts` with Drizzle migration runner
    - Generate initial migration files from schema definition
    - _Requirements: 5.3_

  - [x] 2.4 Implement database retry logic for transient errors
    - Create `withRetry` utility function in `src/lib/db/index.ts`
    - Detect transient errors (ECONNRESET, ETIMEDOUT, 57P01) and retry once after 500ms
    - Non-transient errors (constraint violations, invalid data) return immediately without retry
    - Use parameterized queries for all operations (SQL injection prevention)
    - _Requirements: 5.4, 5.5, 5.8, 5.9_

  - [x]* 2.5 Write property test for form data persistence round-trip
    - **Property 1: Form Data Persistence Round-Trip**
    - Generate random valid form data (Chinese/English names, valid emails, random enum values)
    - Verify persisted and retrieved records have equivalent field values and valid UTC created_at
    - **Validates: Requirements 1.6, 2.10, 3.7, 4.6, 5.6**

- [x] 3. Implement Redis cache and rate limiter
  - [x] 3.1 Set up Redis connection with ioredis
    - Create `src/lib/redis/index.ts` with ioredis configuration (connect timeout: 5s, lazyConnect)
    - Implement availability tracking (isAvailable flag on connect/error events)
    - Implement graceful degradation: bypass cache/rate-limit when Redis unavailable, log warning
    - _Requirements: 8.1, 8.5, 8.6_

  - [x] 3.2 Implement sliding window rate limiter
    - Create `src/lib/redis/rate-limiter.ts` with Redis Sorted Set based sliding window
    - Implement `checkRateLimit(ip, formType)` returning null (pass) or seconds to wait
    - Configure: 5 requests per 60-second window per IP + formType combination
    - Return 429 status with Retry-After header (whole seconds remaining) when exceeded
    - _Requirements: 8.2, 8.3_

  - [x] 3.3 Implement cache service for Newsletter email lookups
    - Create cache get/set operations with configurable TTL
    - Cache Newsletter subscription email lookups with 1-hour TTL
    - Return cached duplicate status on cache hit without querying PostgreSQL
    - _Requirements: 8.4_

  - [x]* 3.4 Write property test for rate limiter sliding window
    - **Property 7: Rate Limiter Sliding Window Enforcement**
    - Generate random IP addresses and request sequences (length 1-20)
    - Verify 6th+ request within 60s window returns 429 with positive Retry-After
    - **Validates: Requirements 8.2, 8.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement input validation and sanitization
  - [x] 5.1 Create Zod validation schemas for all form types
    - Create `src/lib/validation/schemas.ts` with Zod v4 schemas
    - LP Interest: name (max 100), institution (max 200), email (RFC 5322, max 254), fund_types (from predefined list), etc.
    - Developer: company_name, contact_name, email, region, project_type, capacity_mw (0.1-10000 numeric), etc.
    - Contact (investor): name, company, email with format validation
    - Contact (general): name, email, message (max 5000 characters)
    - Newsletter: email (RFC 5322, max 254)
    - Enforce single-line max 1000 chars, multi-line max 5000 chars
    - _Requirements: 1.2, 1.3, 1.9, 2.2, 3.3, 4.2, 9.1_

  - [x] 5.2 Implement input sanitizer
    - Create `src/lib/validation/sanitizer.ts`
    - Encode HTML entities (`<`, `>`, `&`, `"`, `'`)
    - Remove `<script>` tags and HTML event handler attributes (onclick, onerror, onload, etc.)
    - Apply sanitization to all text inputs before persistence
    - _Requirements: 9.2_

  - [x]* 5.3 Write property test for invalid input rejection
    - **Property 2: Invalid Input Rejection with Field-Specific Errors**
    - Generate form submissions with 1-N validation violations
    - Verify 400 status with error identifying each specific failed field
    - **Validates: Requirements 1.2, 1.3, 1.9, 2.2, 3.3, 4.2**

  - [x]* 5.4 Write property test for input sanitization invariant
    - **Property 3: Input Sanitization Invariant**
    - Generate strings with random HTML/JS injection payloads
    - Verify output contains zero script tags, zero event handlers, all special chars encoded
    - **Validates: Requirements 9.2**

  - [x]* 5.5 Write property test for string length enforcement
    - **Property 4: String Length Enforcement**
    - Generate strings exceeding 1000 chars (single-line) and 5000 chars (multi-line)
    - Verify 400 status identifying which field exceeded length limit
    - **Validates: Requirements 9.1**

- [x] 6. Implement file storage service
  - [x] 6.1 Implement file validation and storage
    - Create `src/lib/upload/index.ts` with `FileStorageService`
    - Validate MIME type by checking both file extension AND Content-Type header
    - Validate file size (max 10MB per file)
    - Validate file count (max 5 per submission)
    - Store files with UUID-generated filename + original extension (prevent path traversal)
    - Store in configurable directory from `UPLOAD_DIR` environment variable
    - Return stored file metadata (original name, stored name, path, size, MIME type)
    - Handle disk space / I/O errors with 500 status
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 2.3, 2.4, 2.5, 2.6_

  - [x]* 6.2 Write property test for file MIME type dual validation
    - **Property 5: File MIME Type Dual Validation**
    - Generate random MIME type + extension combinations (valid and invalid)
    - Verify acceptance only when both extension AND Content-Type match allowed list
    - **Validates: Requirements 2.3, 2.4, 7.1, 7.7**

  - [x]* 6.3 Write property test for file path traversal prevention
    - **Property 6: File Storage Path Traversal Prevention**
    - Generate filenames with `../`, `..\\`, absolute paths, null bytes, path traversal sequences
    - Verify stored filename is UUID + original extension, path resolves within upload directory
    - **Validates: Requirements 7.3**

- [x] 7. Implement email service
  - [x] 7.1 Implement email service with SMTP and retry logic
    - Create `src/lib/email/index.ts` with nodemailer SMTP configuration from environment variables
    - Implement `sendTeamNotification` with form-type-based routing (IR team, dev team, support team)
    - Implement `sendSubmitterConfirmation` with locale-based templates (zh/en)
    - Implement `sendWelcomeEmail` for Newsletter subscriptions with unsubscribe link
    - Implement exponential backoff retry (1s → 2s → 4s, max 3 attempts)
    - Execute email sending asynchronously (non-blocking to API response)
    - Mark submission with email_failed status after all retries exhausted
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 7.2 Create HTML email templates
    - Create `src/lib/email/templates/` directory with HTML templates
    - Team notification template: structured display of all submitted fields with labels
    - Submitter confirmation template: bilingual (Chinese/English) based on locale
    - Newsletter welcome template: include unsubscribe link
    - _Requirements: 6.3, 6.4, 6.8_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement form API route handlers
  - [x] 9.1 Implement LP Interest form API route
    - Create `src/app/api/forms/lp-interest/route.ts`
    - Wire middleware pipeline: request ID → CORS → content-type → rate limit → validate → sanitize
    - Implement POST handler: parse JSON body, validate with Zod schema, persist to DB, trigger async email
    - Implement GET/PUT/DELETE handlers returning 405
    - Return standardized success/error JSON responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 9.2 Implement Developer form API route
    - Create `src/app/api/forms/developer/route.ts`
    - Handle multipart/form-data for file uploads
    - Validate form fields and file constraints (type, size, count)
    - Persist submission data and file metadata to DB
    - Trigger async email with file attachment links
    - Handle 5-second response timeout requirement
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [x] 9.3 Implement Contact form API route
    - Create `src/app/api/forms/contact/route.ts`
    - Support both investor inquiry and general inquiry modes
    - Validate mode-specific required fields
    - Implement per-email rate limiting (5 submissions per 10 minutes from same email)
    - Route team notifications based on inquiry type (investor → IR team, general → support team)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 9.4 Implement Newsletter subscription API route
    - Create `src/app/api/forms/newsletter/route.ts`
    - Check Redis cache for duplicate email before DB query
    - Handle idempotent subscription (return success for existing emails without duplicate record)
    - Trigger async welcome email for new subscriptions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 9.5 Implement Newsletter unsubscribe API route
    - Create `src/app/api/newsletter/unsubscribe/route.ts`
    - Validate unsubscribe token (UUID format)
    - Update subscription status to "unsubscribed" for valid token
    - Return error for invalid or non-existent token
    - _Requirements: 4.7, 4.8_

  - [x]* 9.6 Write property test for Newsletter subscription idempotence
    - **Property 8: Newsletter Subscription Idempotence**
    - Submit same valid email N times, verify exactly one DB record and all responses successful
    - **Validates: Requirements 4.3**

  - [x]* 9.7 Write property test for Newsletter unsubscribe token handling
    - **Property 9: Newsletter Unsubscribe Token Handling**
    - Verify valid token changes status to unsubscribed; invalid UUID returns error
    - **Validates: Requirements 4.7, 4.8**

- [x] 10. Implement response structure and security validation
  - [x] 10.1 Implement unified response helpers and security logging
    - Create response helper functions enforcing `{ success: true, data? }` and `{ success: false, error: { code, message, fields? } }` structure
    - Ensure 500/503 responses use fixed non-descriptive message, exclude stack traces/internal paths/table names
    - Implement validation failure logging (client IP, request path, method, failed rule, timestamp)
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 9.6_

  - [x]* 10.2 Write property test for API response structure invariant
    - **Property 10: API Response Structure Invariant**
    - Generate various success/failure scenarios, verify response matches expected JSON structure
    - Verify error message ≤ 256 characters
    - **Validates: Requirements 10.1, 10.2**

  - [x]* 10.3 Write property test for server error information hiding
    - **Property 11: Server Error Information Hiding**
    - Generate internal error scenarios, verify no stack traces/file paths/table names/service IDs in response
    - **Validates: Requirements 10.3**

  - [x]* 10.4 Write property test for request ID propagation
    - **Property 12: Request ID Propagation**
    - Trigger form submissions, collect all log entries, verify same UUID v4 requestId across all entries
    - **Validates: Requirements 10.4, 10.6**

  - [x]* 10.5 Write property test for email routing correctness
    - **Property 13: Email Routing Correctness**
    - Generate submissions for each form type, verify notification routed to correct team recipient
    - **Validates: Requirements 6.2**

  - [x]* 10.6 Write property test for email notification content completeness
    - **Property 14: Email Notification Content Completeness**
    - Generate random form submissions, verify every submitted field appears in notification email body
    - **Validates: Requirements 6.3**

- [x] 11. Integration wiring and environment configuration
  - [x] 11.1 Create environment variable configuration and validation
    - Create `.env.example` with all required environment variables documented
    - Implement environment validation at startup (fail fast on missing required variables)
    - Configure SMTP settings, database URL, Redis connection, upload directory, CORS origin
    - _Requirements: 6.1, 5.1, 8.1, 7.5, 9.5_

  - [x] 11.2 Wire front-end forms to backend API endpoints
    - Update LP Interest form to POST to `/api/forms/lp-interest`
    - Update Developer form to POST to `/api/forms/developer` with FormData
    - Update Contact form to POST to `/api/forms/contact`
    - Update Newsletter form to POST to `/api/forms/newsletter`
    - Add error handling and display API validation errors in UI
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.1_

  - [x]* 11.3 Write integration tests for API endpoints
    - Test complete request flow for each form type (validation → persistence → response)
    - Test rate limiting behavior across endpoints
    - Test file upload with valid and invalid files
    - Test Newsletter subscribe/unsubscribe flow
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 8.2_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from design document (Properties 1-14)
- Unit tests validate specific examples and edge cases
- TypeScript is the implementation language throughout (consistent with existing Next.js 16 project)
- All property tests use fast-check library with minimum 100 iterations per property
- Test files should be placed in the `test/` directory following the structure defined in the design document

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "2.4", "3.2", "3.3"] },
    { "id": 4, "tasks": ["2.5", "3.4", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 6, "tasks": ["6.1", "7.1"] },
    { "id": 7, "tasks": ["6.2", "6.3", "7.2"] },
    { "id": 8, "tasks": ["9.1", "9.4", "9.5"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.6", "9.7"] },
    { "id": 10, "tasks": ["10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3", "10.4", "10.5", "10.6"] },
    { "id": 12, "tasks": ["11.1"] },
    { "id": 13, "tasks": ["11.2", "11.3"] }
  ]
}
```
