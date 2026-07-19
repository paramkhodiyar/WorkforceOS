import { Router } from "express";
import { buildClientTrialEmailHtml, buildLeadEmailHtml } from "../utils/email.templates";
import { authRouter } from "../modules/auth/auth.router";
import { onboardingRouter } from "../modules/onboarding/onboarding.router";
import { organizationRouter } from "../modules/organization/organization.router";
import { employeesRouter } from "../modules/employees/employees.router";
import { attendanceRouter } from "../modules/attendance/attendance.router";
import { leaveRouter } from "../modules/leave/leave.router";
import { tasksRouter } from "../modules/tasks/tasks.router";
import { performanceRouter } from "../modules/performance/performance.router";
import { payrollRouter } from "../modules/payroll/payroll.router";
import { expensesRouter } from "../modules/expenses/expenses.router";
import { assetsRouter } from "../modules/assets/assets.router";
import { knowledgeRouter } from "../modules/knowledge/knowledge.router";
import { notificationsRouter } from "../modules/notifications/notifications.router";
import { auditRouter } from "../modules/audit/audit.router";
import { departmentsRouter } from "../modules/departments/departments.router";
import { teamsRouter } from "../modules/teams/teams.router";
import { calendarRouter } from "../modules/calendar/calendar.router";
import { statsRouter } from "../modules/stats/stats.router";
import { chatbotRouter } from "../modules/chatbot/chatbot.router";
import { rateLimitByUser } from "../middleware/rateLimit.middleware";

const router = Router();

router.get("/email-preview", (req, res) => {
  const dummyData = {
    firstName: "Alice",
    lastName: "Founder",
    email: "alice@startup.com",
    phone: "+1 555-1234",
    companyName: "Acme Corp",
    companySize: "11-50",
    challenge: "Scaling operations securely",
    submittedAt: new Date().toLocaleString(),
    source: "Direct"
  };

  const clientHtml = buildClientTrialEmailHtml(dummyData);
  const leadHtml = buildLeadEmailHtml(dummyData);

  res.send(`
    <html><body style="padding: 20px; font-family: sans-serif; background: #e2e8f0; margin: 0;">
      <h2>Client Confirmation Email Preview</h2>
      <iframe srcdoc='${clientHtml.replace(/'/g, "&apos;")}' style="width: 100%; height: 800px; border: none; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>
      
      <h2 style="margin-top: 40px;">Admin Lead Email Preview</h2>
      <iframe srcdoc='${leadHtml.replace(/'/g, "&apos;")}' style="width: 100%; height: 800px; border: none; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>
    </body></html>
  `);
});

router.use("/auth", authRouter);
router.use("/onboarding", onboardingRouter);
router.use("/chatbot", chatbotRouter);

// Apply user-scoped rate limiting to all authenticated api endpoints
router.use(rateLimitByUser(200, 60));

router.use("/organization", organizationRouter);
router.use("/employees", employeesRouter);
router.use("/attendance", attendanceRouter);
router.use("/leave", leaveRouter);
router.use("/tasks", tasksRouter);
router.use("/performance", performanceRouter);
router.use("/payroll", payrollRouter);
router.use("/expenses", expensesRouter);
router.use("/assets", assetsRouter);
router.use("/knowledge", knowledgeRouter);
router.use("/notifications", notificationsRouter);
router.use("/audit", auditRouter);
router.use("/departments", departmentsRouter);
router.use("/teams", teamsRouter);
router.use("/calendar", calendarRouter);
router.use("/stats", statsRouter);

export default router;
