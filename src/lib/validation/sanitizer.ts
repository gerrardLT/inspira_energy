/**
 * 输入消毒器（Input Sanitizer）
 *
 * 对所有文本输入进行安全清理，防止 XSS 攻击和 HTML 注入。
 *
 * 处理顺序（确保幂等性）：
 * 1. 移除 <script>...</script> 标签及其内容
 * 2. 移除 HTML 事件处理器属性（onclick, onerror, onload 等所有 on* 属性）
 * 3. 编码 HTML 实体字符（<, >, &, ", '）
 *
 * @module validation/sanitizer
 */

// ─── HTML 实体映射 ──────────────────────────────────────────────────────────────

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

// ─── 正则表达式 ─────────────────────────────────────────────────────────────────

/**
 * 匹配 <script>...</script> 标签及其内容（包括嵌套、多行）
 * - 大小写不敏感
 * - 匹配自闭合 <script/> 和带内容的 <script>...</script>
 */
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

/** 匹配自闭合 script 标签 <script ... /> */
const SCRIPT_SELF_CLOSING_REGEX = /<script\b[^>]*\/>/gi;

/** 匹配未闭合的 <script> 开始标签 */
const SCRIPT_OPEN_TAG_REGEX = /<script\b[^>]*>/gi;

/**
 * 匹配 HTML 事件处理器属性（所有 on* 属性）
 * - 支持带引号和不带引号的值
 * - 大小写不敏感
 */
const EVENT_HANDLER_REGEX = /\s*on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

/** 匹配需要编码的 HTML 特殊字符 */
const HTML_SPECIAL_CHARS_REGEX = /[&<>"']/g;

// ─── 核心消毒函数 ──────────────────────────────────────────────────────────────────

/**
 * 移除字符串中的 <script> 标签及其内容
 */
function removeScriptTags(input: string): string {
  let result = input;
  // 移除完整 script 标签及内容
  result = result.replace(SCRIPT_TAG_REGEX, "");
  // 移除自闭合 script 标签
  result = result.replace(SCRIPT_SELF_CLOSING_REGEX, "");
  // 移除残留的 script 开始标签
  result = result.replace(SCRIPT_OPEN_TAG_REGEX, "");
  return result;
}

/**
 * 移除字符串中的 HTML 事件处理器属性
 * 例如：onclick="alert(1)" → ""
 */
function removeEventHandlers(input: string): string {
  return input.replace(EVENT_HANDLER_REGEX, "");
}

/**
 * 将 HTML 特殊字符编码为实体
 * < → &lt;  > → &gt;  & → &amp;  " → &quot;  ' → &#x27;
 */
function encodeHtmlEntities(input: string): string {
  return input.replace(
    HTML_SPECIAL_CHARS_REGEX,
    (char) => HTML_ENTITY_MAP[char] ?? char
  );
}

// ─── 公共 API ───────────────────────────────────────────────────────────────────

/**
 * 对单个字符串输入进行消毒处理
 *
 * 处理顺序：
 * 1. 移除 script 标签及其内容
 * 2. 移除事件处理器属性
 * 3. 编码 HTML 实体字符
 *
 * 该函数是幂等的：对已消毒的字符串再次调用将产生相同结果。
 *
 * @param input - 原始输入字符串
 * @returns 消毒后的安全字符串
 */
export function sanitizeInput(input: string): string {
  // Step 1: 移除 script 标签
  let sanitized = removeScriptTags(input);
  // Step 2: 移除事件处理器属性
  sanitized = removeEventHandlers(sanitized);
  // Step 3: 编码 HTML 实体
  sanitized = encodeHtmlEntities(sanitized);
  return sanitized;
}

/**
 * 递归消毒对象中所有字符串值
 *
 * 遍历对象的所有属性，对字符串值应用 `sanitizeInput`，
 * 对嵌套对象递归处理，对数组中的每个元素递归处理。
 * 非字符串、非对象、非数组的值保持不变。
 *
 * @param obj - 包含待消毒字符串值的对象
 * @returns 所有字符串值已消毒的新对象（不修改原对象）
 */
export function sanitizeObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => sanitizeValue(item));
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * 对单个值进行消毒（内部辅助函数）
 * 处理字符串、对象和数组类型，其他类型原样返回
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeInput(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (value !== null && typeof value === "object") {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
}
