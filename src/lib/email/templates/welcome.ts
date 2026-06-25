/**
 * Newsletter 欢迎邮件 HTML 模板
 *
 * 职责：
 * - 生成 Newsletter 订阅确认/欢迎邮件
 * - 支持中英文双语（基于 locale）
 * - 包含退订链接（unsubscribe link）
 * - 包含 Inspira Energy 品牌元素
 *
 * Validates: Requirements 6.8
 */

// ─── 中文欢迎模板 ────────────────────────────────────────────────────────────────

/**
 * 生成中文版本的 Newsletter 欢迎邮件 HTML
 *
 * @param unsubscribeUrl - 完整的退订链接 URL
 * @returns 完整的中文 HTML 邮件字符串
 */
function buildWelcomeHtmlZh(unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background-color: #f5f7fa;">
  <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with branding -->
    <tr>
      <td style="padding: 24px 32px; background-color: #1a5276; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Inspira Energy</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; color: #1a5276; font-size: 18px;">欢迎订阅 Inspira Energy Newsletter</h2>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          感谢您的订阅！您将定期收到我们的新能源投资行业洞察和最新动态。
        </p>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          我们致力于为您提供：
        </p>
        <ul style="margin: 0 0 16px; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
          <li>新能源市场趋势与政策解读</li>
          <li>项目投资案例与回报分析</li>
          <li>行业活动与合作机会</li>
        </ul>
      </td>
    </tr>
    <!-- Unsubscribe -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="margin: 0; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px;">
          此邮件由系统自动发送，请勿直接回复。<br>
          如需退订，请点击：<a href="${escapeHtml(unsubscribeUrl)}" style="color: #1a5276; text-decoration: underline;">取消订阅</a><br>
          &copy; Inspira Energy Pte. Ltd.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 英文欢迎模板 ────────────────────────────────────────────────────────────────

/**
 * 生成英文版本的 Newsletter 欢迎邮件 HTML
 *
 * @param unsubscribeUrl - 完整的退订链接 URL
 * @returns 完整的英文 HTML 邮件字符串
 */
function buildWelcomeHtmlEn(unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background-color: #f5f7fa;">
  <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with branding -->
    <tr>
      <td style="padding: 24px 32px; background-color: #1a5276; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Inspira Energy</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; color: #1a5276; font-size: 18px;">Welcome to Inspira Energy Newsletter</h2>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          Thank you for subscribing! You will receive regular insights and updates on renewable energy investments.
        </p>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          We are committed to bringing you:
        </p>
        <ul style="margin: 0 0 16px; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
          <li>Renewable energy market trends and policy analysis</li>
          <li>Project investment cases and return analysis</li>
          <li>Industry events and partnership opportunities</li>
        </ul>
      </td>
    </tr>
    <!-- Unsubscribe -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <p style="margin: 0; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px;">
          This is an automated email. Please do not reply directly.<br>
          To unsubscribe: <a href="${escapeHtml(unsubscribeUrl)}" style="color: #1a5276; text-decoration: underline;">Unsubscribe</a><br>
          &copy; Inspira Energy Pte. Ltd.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 统一入口 ────────────────────────────────────────────────────────────────────

/**
 * 生成 Newsletter 欢迎邮件 HTML
 *
 * 根据 unsubscribeToken 构建退订链接，基于 locale 选择对应语言模板。
 *
 * @param unsubscribeToken - 退订凭证 UUID
 * @param locale - 语言偏好 ("zh" | "en")
 * @returns 完整的 HTML 邮件字符串（含退订链接）
 */
export function buildWelcomeEmailHtml(
  unsubscribeToken: string,
  locale: string
): string {
  const baseUrl = process.env.CORS_ORIGIN ?? "https://www.inspiraenergy.com";
  const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  if (locale === "zh") {
    return buildWelcomeHtmlZh(unsubscribeUrl);
  }
  return buildWelcomeHtmlEn(unsubscribeUrl);
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────────

/** HTML 实体转义，防止 XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
