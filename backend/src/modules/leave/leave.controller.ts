import { Request, Response } from "express";
import { LeaveService } from "./leave.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const year = new Date().getFullYear();
  const balances = await LeaveService.getBalance(userId, year);
  return sendSuccess(res, balances);
});

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const request = await LeaveService.apply(userId, orgId, req.body, req);
  return sendSuccess(res, request, "Leave request submitted successfully");
});

export const getMyRequests = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page, limit } = parsePagination(req.query);
  const status = req.query.status as any;
  const leaveType = req.query.leaveType as any;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

  const result = await LeaveService.getMyRequests(userId, { status, leaveType, year }, page, limit);

  return sendPaginated(res, result.requests, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const getApprovals = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { page, limit } = parsePagination(req.query);
  const result = await LeaveService.getPendingApprovals(req.user, orgId, page, limit);

  return sendPaginated(res, result.requests, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const approverId = req.user!.id;
  const request = await LeaveService.approve(orgId, req.params.id, approverId, req.body.comment, req);
  return sendSuccess(res, request, "Leave request approved by manager");
});

export const hrApprove = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const approverId = req.user!.id;
  const request = await LeaveService.hrApprove(orgId, req.params.id, approverId, req.body.comment, req);
  return sendSuccess(res, request, "Leave request approved by HR");
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const approverId = req.user!.id;
  const request = await LeaveService.reject(orgId, req.params.id, approverId, req.body.comment, req);
  return sendSuccess(res, request, "Leave request rejected");
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const request = await LeaveService.cancel(userId, orgId, req.params.id, req);
  return sendSuccess(res, request, "Leave request cancelled");
});

export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const departmentId = req.query.departmentId as string;
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

  const calendar = await LeaveService.getCalendar(orgId, departmentId, month, year);
  return sendSuccess(res, calendar);
});

export const getPolicy = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const policies = await LeaveService.getPolicies(orgId);
  return sendSuccess(res, policies);
});

export const updatePolicy = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const { leaveType, daysAllowed } = req.body;
  const policy = await LeaveService.updatePolicy(orgId, leaveType, daysAllowed, actorId, req);
  return sendSuccess(res, policy, "Leave policy updated successfully");
});
