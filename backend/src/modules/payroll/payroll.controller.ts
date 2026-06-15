import { Request, Response } from "express";
import { PayrollService } from "./payroll.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { getPermissionScopes } from "../../utils/permission.util";

export const getRuns = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const status = req.query.status as any;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

  const runs = await PayrollService.getRuns(orgId, { year, status });
  return sendSuccess(res, runs);
});

export const generateRun = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const { month, year } = req.body;

  const run = await PayrollService.generateRun(orgId, month, year, actorId, req);
  return sendSuccess(res, run, "Payroll run generated successfully", 201);
});

export const getRun = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const run = await PayrollService.getRunById(req.params.runId, orgId);
  return sendSuccess(res, run);
});

export const approveRun = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const run = await PayrollService.approveRun(req.params.runId, orgId, actorId, req);
  return sendSuccess(res, run, "Payroll run approved successfully");
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const run = await PayrollService.markPaid(req.params.runId, orgId, actorId, req);
  return sendSuccess(res, run, "Payroll run paid successfully");
});

export const getMyPayslips = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page, limit } = parsePagination(req.query);
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

  const result = await PayrollService.getEmployeePayslips(userId, year, page, limit);

  return sendPaginated(res, result.records, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const getPayslip = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const readScopes = await getPermissionScopes(req.user!, orgId, "payroll", "read");
  const isSuperAdmin = req.user!.systemRole === "SUPER_ADMIN";
  const hasGlobalRead = readScopes.isGlobal;
 
  const payslip = await PayrollService.getPayslipById(
    req.params.recordId,
    isSuperAdmin ? undefined : orgId,
    hasGlobalRead ? undefined : userId
  );
  return sendSuccess(res, payslip);
});

export const exportRun = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const data = await PayrollService.exportRun(req.params.runId, orgId);
  return sendSuccess(res, data);
});
