/**
 * 邮件模板统一导出
 *
 * 将各模板模块的公共接口聚合导出，便于 EmailService 使用。
 */

export {
  buildTeamNotificationHtml,
  getNotificationSubject,
} from "./team-notification";

export {
  buildConfirmationHtml,
  buildConfirmationHtmlZh,
  buildConfirmationHtmlEn,
} from "./confirmation";

export {
  buildWelcomeEmailHtml,
} from "./welcome";
