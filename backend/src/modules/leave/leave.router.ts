import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  getBalance,
  apply,
  getMyRequests,
  getApprovals,
  approve,
  hrApprove,
  reject,
  cancel,
  getCalendar,
  getPolicy,
  updatePolicy
} from "./leave.controller";
import {
  applyLeaveSchema,
  approveSchema,
  rejectSchema,
  getCalendarSchema,
  policySchema
} from "./leave.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("leave"));

router.get("/balance", getBalance);
router.post("/apply", validate(applyLeaveSchema), apply);
router.get("/my-requests", getMyRequests);
router.get("/approvals", requirePermission("leave", "approve"), getApprovals);
router.post("/approvals/:id/approve", requirePermission("leave", "approve"), validate(approveSchema), approve);
router.post("/approvals/:id/hr-approve", requirePermission("leave", "hr_approve"), validate(approveSchema), hrApprove);
router.post("/approvals/:id/reject", validate(rejectSchema), reject);
router.delete("/:id/cancel", cancel);
router.get("/calendar", validate(getCalendarSchema, "query"), getCalendar);
router.get("/policy", requirePermission("leave", "read"), getPolicy);
router.patch("/policy", requirePermission("leave", "manage_policy"), validate(policySchema), updatePolicy);

export const leaveRouter = router;
