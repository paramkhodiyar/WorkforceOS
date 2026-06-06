import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  getRuns,
  generateRun,
  getRun,
  approveRun,
  markPaid,
  getMyPayslips,
  getPayslip,
  exportRun
} from "./payroll.controller";
import { getRunsSchema, generateRunSchema, myPayslipsSchema } from "./payroll.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("payroll"));

router.get("/runs", requirePermission("payroll", "read"), validate(getRunsSchema, "query"), getRuns);
router.post("/runs", requirePermission("payroll", "generate"), validate(generateRunSchema), generateRun);
router.get("/my-payslips", validate(myPayslipsSchema, "query"), getMyPayslips);
router.get("/payslips/:recordId", getPayslip);
router.get("/runs/:runId", requirePermission("payroll", "read"), getRun);
router.post("/runs/:runId/approve", requirePermission("payroll", "approve"), approveRun);
router.post("/runs/:runId/mark-paid", requirePermission("payroll", "mark_paid"), markPaid);
router.get("/runs/:runId/export", requirePermission("payroll", "read"), exportRun);

export const payrollRouter = router;
