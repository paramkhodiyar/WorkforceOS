import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import { upload } from "../../utils/upload.util";
import {
  createClaim,
  updateClaim,
  submitClaim,
  uploadAttachment,
  getMyClaims,
  getApprovals,
  approve,
  financeApprove,
  markPaid,
  reject
} from "./expenses.controller";
import {
  createExpenseSchema,
  updateExpenseSchema,
  rejectExpenseSchema,
  getMyClaimsSchema
} from "./expenses.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("expenses"));

router.post("/", validate(createExpenseSchema), createClaim);
router.patch("/:id", validate(updateExpenseSchema), updateClaim);
router.post("/:id/submit", submitClaim);
router.post("/:id/attachments", upload.single("receipt"), uploadAttachment);
router.get("/my-claims", validate(getMyClaimsSchema, "query"), getMyClaims);
router.get("/approvals", requirePermission("expense", "approve"), getApprovals);
router.post("/:id/approve", approve);
router.post("/:id/finance-approve", requirePermission("expense", "finance_approve"), financeApprove);
router.post("/:id/mark-paid", markPaid);
router.post("/:id/reject", validate(rejectExpenseSchema), reject);

export const expensesRouter = router;
