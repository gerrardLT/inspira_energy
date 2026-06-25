/**
 * 健康检查 API Route Handler
 *
 * 端点：GET /api/health
 * 认证：无需 API Key（便于外部监控工具轮询）
 *
 * 功能：
 * - 调用 HealthService 并行检查 PostgreSQL 和 Redis 连通性
 * - 全部 healthy → HTTP 200，任一 unhealthy → HTTP 503
 * - 返回 JSON 格式的组件状态和响应时间
 *
 * Requirements: 4.1, 4.7
 */

import { NextResponse } from "next/server";

import { HealthService } from "@/lib/health";

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const result = await HealthService.check();

  const statusCode = result.status === "healthy" ? 200 : 503;

  return NextResponse.json(result, { status: statusCode });
}
