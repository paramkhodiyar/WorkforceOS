import { Router } from "express";
import { authRouter } from "../modules/auth/auth.router";
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

const router = Router();

router.use("/auth", authRouter);
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

export default router;
