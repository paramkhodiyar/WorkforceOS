import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from "./departments.controller";
import {
  createDepartmentSchema,
  updateDepartmentSchema
} from "./departments.validation";

const router = Router();

router.use(authenticate);

router.get("/", listDepartments);
router.get("/:id", getDepartment);
router.post("/", requirePermission("employee", "create"), validate(createDepartmentSchema), createDepartment);
router.patch("/:id", validate(updateDepartmentSchema), updateDepartment);
router.delete("/:id", requirePermission("employee", "delete"), deleteDepartment);

export const departmentsRouter = router;
