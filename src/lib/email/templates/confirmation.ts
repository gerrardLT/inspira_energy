/**
 * 提交者确认邮件 HTML 模板
 *
 * 职责：
 * - 根据 locale（zh/en）生成对应语言的确认邮件
 * - 告知提交者表单已收到，团队将在 5 个工作日内联系
 * - 包含 Inspira Energy 品牌元素
 *
 * Validates: Requirements 6.4
 */

// ─── 表单类型标签 ────────────────────────────────────────────────────────────────

/** 根据表单类型和语言获取表单显示名称 */
function getFormTypeLabel(formType: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    zh: {
      "lp-interest": "投资意向表单",
      developer: "开发商路条提交",
      "contact-investor": "投资者咨询",
      "contact-general": "通用咨询",
      newsletter: "Newsletter 订阅",
    },
    en: {
      "lp-interest": "LP Interest Form",
      developer: "Developer Submission",
      "contact-investor": "Investor Inquiry",
      "contact-general": "General Inquiry",
      newsletter: "Newsletter Subscription",
    },
  };

  return labels[locale]?.[formType] ?? formType;
}

// ─── 中文确认模板 ────────────────────────────────────────────────────────────────

/**
 * 生成中文版本的提交确认邮件 HTML
 *
 * @param formType - 表单类型标识
 * @returns 完整的中文 HTML 邮件字符串
 */
export function buildConfirmationHtmlZh(formType: string): string {
  const formLabel = getFormTypeLabel(formType, "zh");

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
        <h2 style="margin: 0 0 16px; color: #1a5276; font-size: 18px;">感谢您的提交</h2>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          我们已收到您的${formLabel}，团队将在 <strong>5 个工作日</strong>内与您联系。
        </p>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          如有紧急事项，请发送邮件至
          <a href="mailto:info@inspiraenergy.com" style="color: #1a5276; text-decoration: underline;">info@inspiraenergy.com</a>。
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 32px 24px;">
        <p style="margin: 0; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px;">
          此邮件由系统自动发送，请勿直接回复。<br>
          &copy; Inspira Energy Pte. Ltd.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 英文确认模板 ────────────────────────────────────────────────────────────────

/**
 * 生成英文版本的提交确认邮件 HTML
 *
 * @param formType - 表单类型标识
 * @returns 完整的英文 HTML 邮件字符串
 */
export function buildConfirmationHtmlEn(formType: string): string {
  const formLabel = getFormTypeLabel(formType, "en");

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
        <h2 style="margin: 0 0 16px; color: #1a5276; font-size: 18px;">Thank You for Your Submission</h2>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          We have received your ${formLabel}. Our team will contact you within <strong>5 business days</strong>.
        </p>
        <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
          For urgent matters, please email
          <a href="mailto:info@inspiraenergy.com" style="color: #1a5276; text-decoration: underline;">info@inspiraenergy.com</a>.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 32px 24px;">
        <p style="margin: 0; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 16px;">
          This is an automated email. Please do not reply directly.<br>
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
 * 根据 locale 生成确认邮件 HTML
 *
 * @param formType - 表单类型标识
 * @param locale - 语言偏好 ("zh" | "en")
 * @returns 对应语言的完整 HTML 邮件字符串
 */
export function buildConfirmationHtml(formType: string, locale: string): string {
  if (locale === "zh") {
    return buildConfirmationHtmlZh(formType);
  }
  return buildConfirmationHtmlEn(formType);
}
