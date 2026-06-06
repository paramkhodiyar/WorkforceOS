import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import { getLogs, getLogById, exportLogs } from "./audit.controller";
import { getAuditLogsSchema } from "./audit.validation";

const router = Router();

router.use(authenticate);

router.get("/logs", requirePermission("audit", "read"), validate(getAuditLogsSchema, "query"), getLogs);
router.get("/logs/export", requirePermission("audit", "read"), validate(getAuditLogsSchema, "query"), exportLogs);
router.get("/logs/:id", requirePermission("audit", "read"), getLogById);

export const auditRouter = router;
