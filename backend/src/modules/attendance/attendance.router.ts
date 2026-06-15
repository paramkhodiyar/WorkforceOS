import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  checkIn,
  checkOut,
  breakStart,
  breakEnd,
  getToday,
  getHistory,
  getTeam,
  getExceptions,
  adjust,
  getSummary,
  getShifts,
  listAdjustments,
  approveAdjustment,
  rejectAdjustment
} from "./attendance.controller";
import { checkInSchema, adjustSchema, getHistorySchema, getSummarySchema } from "./attendance.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("attendance"));

router.get("/shifts", getShifts);
router.post("/check-in", validate(checkInSchema), checkIn);
router.post("/check-out", checkOut);
router.post("/break-start", breakStart);
router.post("/break-end", breakEnd);
router.get("/today", getToday);
router.get("/history", validate(getHistorySchema, "query"), getHistory);
router.get("/team", requirePermission("attendance", "read_team"), getTeam);
router.get("/exceptions", requirePermission("attendance", "read_team"), getExceptions);
router.post("/adjust/:id", requirePermission("attendance", "adjust"), validate(adjustSchema), adjust);
router.get("/adjustments", requirePermission("attendance", "adjust"), listAdjustments);
router.post("/adjustments/:id/approve", requirePermission("attendance", "adjust"), approveAdjustment);
router.post("/adjustments/:id/reject", requirePermission("attendance", "adjust"), rejectAdjustment);
router.get("/summary/:userId", validate(getSummarySchema, "query"), getSummary);

export const attendanceRouter = router;
