import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/errors.util";
import { getOperationsStats, getEmployeeStats } from "./stats.controller";

const router = Router();

router.use(authenticate);

// Only Admin and HR can access operations stats
const requireAdminOrHR = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.systemRole;
  if (!["SUPER_ADMIN", "ORG_ADMIN", "HR"].includes(role || "")) {
    throw AppError.forbidden("Only Admins and HR can access operations statistics");
  }
  next();
});

router.get("/", requireAdminOrHR, getOperationsStats);
router.get("/employee/:userId", requireAdminOrHR, getEmployeeStats);

export const statsRouter = router;
