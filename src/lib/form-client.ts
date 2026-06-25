/**
 * 前端表单提交客户端工具
 *
 * 提供统一的 API 调用接口，支持 JSON 和 FormData 两种提交方式。
 * 处理网络错误、解析 API 响应、提取字段级验证错误。
 *
 * Requirements: 1.1, 2.1, 3.1, 3.2, 4.1
 */

// ─── 类型定义 ────────────────────────────────────────────────────────────────────

/** API 成功响应 */
export interface ApiSuccessResponse<T = Record<string, unknown>> {
  success: true;
  data?: T;
}

/** API 错误响应 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

/** 表单提交结果 */
export type FormSubmitResult<T = Record<string, unknown>> =
  | { ok: true; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; code?: string };

// ─── 常量配置 ────────────────────────────────────────────────────────────────────

/** 请求超时时间（毫秒）— 30 秒 */
const REQUEST_TIMEOUT_MS = 30_000;

// ─── 提交函数 ────────────────────────────────────────────────────────────────────

/**
 * 提交 JSON 格式的表单数据
 *
 * @param endpoint - API 端点路径，例如 `/api/forms/lp-interest`
 * @param data - 要提交的表单数据对象
 * @returns FormSubmitResult 表示成功或失败（含字段级错误）
 */
export async function submitFormJSON<T = Record<string, unknown>>(
  endpoint: string,
  data: Record<string, unknown>
): Promise<FormSubmitResult<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return parseResponse<T>(response);
  } catch (error) {
    return handleNetworkError(error);
  }
}

/**
 * 提交 FormData 格式的表单数据（用于包含文件上传的表单）
 *
 * @param endpoint - API 端点路径，例如 `/api/forms/developer`
 * @param formData - FormData 实例
 * @returns FormSubmitResult 表示成功或失败（含字段级错误）
 */
export async function submitFormData<T = Record<string, unknown>>(
  endpoint: string,
  formData: FormData
): Promise<FormSubmitResult<T>> {
  try {
    const controller = new AbortController();
    // 文件上传超时更长：60 秒
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS * 2);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return parseResponse<T>(response);
  } catch (error) {
    return handleNetworkError(error);
  }
}

// ─── 内部辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 解析 API 响应，提取成功数据或错误信息
 */
async function parseResponse<T>(response: Response): Promise<FormSubmitResult<T>> {
  let body: ApiSuccessResponse<T> | ApiErrorResponse;

  try {
    body = await response.json();
  } catch {
    // 无法解析 JSON 响应体时，根据 HTTP 状态码提供用户友好消息
    if (response.status === 429) {
      return {
        ok: false,
        message: "提交过于频繁，请稍后再试",
        code: "RATE_LIMITED",
      };
    }
    return {
      ok: false,
      message: "服务器响应格式错误，请稍后重试",
    };
  }

  if (body.success) {
    return {
      ok: true,
      data: (body as ApiSuccessResponse<T>).data,
    };
  }

  // 错误响应
  const errorBody = body as ApiErrorResponse;

  // 为 429 频率限制提供更友好的默认消息
  const message =
    errorBody.error.code === "RATE_LIMITED"
      ? errorBody.error.message || "提交过于频繁，请稍后再试"
      : errorBody.error.message;

  return {
    ok: false,
    message,
    fieldErrors: errorBody.error.fields,
    code: errorBody.error.code,
  };
}

/**
 * 处理网络错误（fetch 抛出的异常）
 */
function handleNetworkError(error: unknown): FormSubmitResult<never> {
  // 请求超时（AbortController 触发）
  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      ok: false,
      message: "请求超时，请检查网络后重试",
      code: "TIMEOUT",
    };
  }

  // 网络断开或 DNS 解析失败等
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      ok: false,
      message: "网络连接失败，请检查网络后重试",
    };
  }

  return {
    ok: false,
    message: "提交失败，请稍后重试",
  };
}
