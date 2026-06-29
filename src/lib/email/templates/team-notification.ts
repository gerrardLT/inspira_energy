/**
 * 团队通知邮件 HTML 模板
 *
 * 职责：
 * - 将表单提交数据格式化为结构化 HTML 通知邮件
 * - 每个字段以「标签: 值」格式呈现
 * - 包含 Inspira Energy 品牌元素
 * - 支持附件链接展示
 *
 * Validates: Requirements 6.3
 */

/** 表单类型联合（与 EmailService 中的 TeamNotificationOptions.formType 对应） */
export type NotificationFormType = "lp-interest" | "developer" | "contact-investor" | "contact-general";

// ─── 字段标签映射 ────────────────────────────────────────────────────────────────

/** 表单字段中英文标签映射（覆盖 camelCase 和 snake_case） */
const FIELD_LABELS: Record<string, string> = {
  name: "姓名",
  institution: "机构",
  position: "职位",
  email: "邮箱",
  phone: "电话",
  fundTypes: "基金类型",
  fund_types: "基金类型",
  regions: "投资区域",
  investmentSize: "投资规模",
  investment_size: "投资规模",
  companyName: "公司名称",
  company_name: "公司名称",
  contactName: "联系人",
  contact_name: "联系人",
  region: "区域",
  projectType: "项目类型",
  project_type: "项目类型",
  capacityMw: "装机容量(MW)",
  capacity_mw: "装机容量(MW)",
  projectStage: "项目阶段",
  project_stage: "项目阶段",
  expectedConstructionDate: "预计开工日期",
  expected_construction_date: "预计开工日期",
  notes: "备注",
  company: "公司",
  subject: "主题",
  message: "消息内容",
  formType: "表单类型",
  form_type: "表单类型",
};

// ─── 通知主题映射 ────────────────────────────────────────────────────────────────

/** 根据表单类型获取通知邮件主题行 */
export function getNotificationSubject(
  formType: NotificationFormType
): string {
  switch (formType) {
    case "lp-interest":
      return "[Inspira Energy] 新 LP 投资意向提交";
    case "developer":
      return "[Inspira Energy] 新开发商路条提交";
    case "contact-investor":
      return "[Inspira Energy] 新投资者咨询";
    case "contact-general":
      return "[Inspira Energy] 新通用咨询";
  }
}

// ─── HTML 生成 ───────────────────────────────────────────────────────────────────

/**
 * 生成团队通知邮件 HTML 内容
 *
 * 将所有提交字段以表格形式呈现，每个字段带有对应的中文标签。
 * 若包含附件链接，以单独行展示可点击链接。
 *
 * @param formType - 表单类型
 * @param formData - 提交的表单数据（所有字段键值对）
 * @param fileLinks - 附件链接列表（可选）
 * @returns 完整的 HTML 邮件字符串
 */
export function buildTeamNotificationHtml(
  formType: NotificationFormType,
  formData: Record<string, unknown>,
  fileLinks?: string[]
): string {
  const subject = getNotificationSubject(formType);

  let rows = "";
  for (const [key, value] of Object.entries(formData)) {
    if (value === undefined || value === null || value === "") continue;
    // 使用 Object.hasOwn 进行安全字段映射，避免命中原型链属性（如 "constructor"、"toString"）
    // 返回非字符串导致 escapeHtml 崩溃
    const label = Object.hasOwn(FIELD_LABELS, key) ? FIELD_LABELS[key] : key;
    const displayValue = Array.isArray(value)
      ? value.join(", ")
      : String(value);
    rows += `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; width: 30%; vertical-align: top; color: #2c3e50;">${escapeHtml(label)}</td>
      <td style="padding: 8px 12px; color: #333;">${escapeHtml(displayValue)}</td>
    </tr>`;
  }

  if (fileLinks && fileLinks.length > 0) {
    const links = fileLinks
      .map((link) => `<a href="${escapeHtml(link)}" style="color: #1a5276; text-decoration: underline;">${escapeHtml(link)}</a>`)
      .join("<br>");
    rows += `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px 12px; font-weight: bold; width: 30%; vertical-align: top; color: #2c3e50;">附件</td>
      <td style="padding: 8px 12px;">${links}</td>
    </tr>`;
  }

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
    <!-- Subject line -->
    <tr>
      <td style="padding: 24px 32px 8px;">
        <h2 style="margin: 0; color: #1a5276; font-size: 18px; font-weight: 600;">${subject}</h2>
        <p style="margin: 8px 0 0; color: #666; font-size: 13px;">以下是提交的表单详情：</p>
      </td>
    </tr>
    <!-- Form data table -->
    <tr>
      <td style="padding: 16px 32px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e8e8e8; border-radius: 4px;">
          ${rows}
        </table>
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
