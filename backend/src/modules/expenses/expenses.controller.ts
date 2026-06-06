import { Request, Response } from "express";
import { ExpensesService } from "./expenses.service";
import { sendSuccess } from "../../utils/response.util";
import { getFileUrl } from "../../utils/upload.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const createClaim = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const claim = await ExpensesService.createClaim(userId, orgId, req.body, req);
  return sendSuccess(res, claim, "Expense claim draft created successfully");
});

export const updateClaim = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const claim = await ExpensesService.updateClaim(req.params.id, userId, orgId, req.body, req);
  return sendSuccess(res, claim, "Expense claim updated successfully");
});

export const submitClaim = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const claim = await ExpensesService.submitClaim(req.params.id, userId, orgId, req);
  return sendSuccess(res, claim, "Expense claim submitted for approval");
});

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const claimId = req.params.id;
  const userId = req.user!.id;

  if (!req.file) {
    throw AppError.badRequest("No file uploaded");
  }

  const fileUrl = getFileUrl(req.file);
  const fileName = req.file.originalname;

  const attach = await ExpensesService.addAttachment(claimId, userId, fileUrl, fileName);
  return sendSuccess(res, attach, "Receipt uploaded successfully");
});

export const getMyClaims = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const filters = {
    status: req.query.status as any,
    fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
    toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
  };

  const claims = await ExpensesService.getMyClaims(userId, filters);
  return sendSuccess(res, claims);
});

export const getApprovals = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const claims = await ExpensesService.getPendingApprovals(req.user, orgId);
  return sendSuccess(res, claims);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const approverId = req.user!.id;
  const claim = await ExpensesService.approve(req.params.id, orgId, approverId, req.body.comment, req);
  return sendSuccess(res, claim, "Expense claim approved by manager");
});

export const financeApprove = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const approverId = req.user!.id;
  const claim = await ExpensesService.financeApprove(req.params.id, orgId, approverId, req.body.comment, req);
  return sendSuccess(res, claim, "Expense claim approved by Finance");
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const claim = await ExpensesService.markPaid(req.params.id, orgId, actorId, req);
  return sendSuccess(res, claim, "Expense claim marked as paid");
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const approverId = req.user!.id;
  const { reason } = req.body;
  const claim = await ExpensesService.reject(req.params.id, orgId, approverId, reason, req);
  return sendSuccess(res, claim, "Expense claim rejected");
});
