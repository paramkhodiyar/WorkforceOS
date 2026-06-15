import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import { upload } from "../../utils/upload.util";
import {
  listEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  listDocuments,
  deleteDocument
} from "./employees.controller";
import { createEmployeeSchema, updateEmployeeSchema } from "./employees.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  (req, res, next) => {
    if (String(req.query.taskAssignees) === "true") {
      return next();
    }
    return requirePermission("employee", "read")(req, res, next);
  },
  listEmployees
);
router.post("/", requirePermission("employee", "create"), validate(createEmployeeSchema), createEmployee);
router.get("/:id", requirePermission("employee", "read"), getEmployeeById);
router.patch("/:id", requirePermission("employee", "update"), validate(updateEmployeeSchema), updateEmployee);
router.delete("/:id", requirePermission("employee", "delete"), deleteEmployee);

router.post("/:id/documents", requirePermission("employee", "update"), upload.single("document"), uploadDocument);
router.get("/:id/documents", listDocuments);
router.delete("/:id/documents/:docId", requirePermission("employee", "update"), deleteDocument);

export const employeesRouter = router;
