import { Request, Response } from "express";
import { DepartmentsService } from "./departments.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const list = await DepartmentsService.listDepartments(orgId);
  return sendSuccess(res, list);
});

export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const dept = await DepartmentsService.getDepartmentById(req.params.id, orgId);
  return sendSuccess(res, dept);
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const dept = await DepartmentsService.createDepartment(orgId, req.body);
  return sendSuccess(res, dept, "Department created successfully");
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const dept = await DepartmentsService.getDepartmentById(req.params.id, orgId);

  const isAuthorizedAdminOrHR =
    req.user!.systemRole === "SUPER_ADMIN" ||
    req.user!.systemRole === "ORG_ADMIN" ||
    (req.user!.roles || []).some((r: any) => r.roleName === "HR_MANAGER");

  if (!isAuthorizedAdminOrHR && dept.headId !== req.user!.id) {
    throw AppError.forbidden("Access denied: insufficient permissions to manage this department");
  }

  const updated = await DepartmentsService.updateDepartment(req.params.id, orgId, req.body);
  return sendSuccess(res, updated, "Department updated successfully");
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  await DepartmentsService.deleteDepartment(req.params.id, orgId);
  return sendSuccess(res, null, "Department deleted successfully");
});
