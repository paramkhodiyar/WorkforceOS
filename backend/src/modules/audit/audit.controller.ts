import { Request, Response } from "express";
import { AuditService } from "./audit.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { AppError } from "../../utils/errors.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { page, limit } = parsePagination(req.query);
  const result = await AuditService.getLogs({
    organizationId: orgId,
    actorId: req.query.actorId as string,
    module: req.query.module as string,
    action: req.query.action as any,
    targetId: req.query.targetId as string,
    targetType: req.query.targetType as string,
    fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
    toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    page,
    limit
  });

  return sendPaginated(res, result.logs, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const getLogById = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const log = await AuditService.getLogById(req.params.id, orgId);
  if (!log) {
    throw AppError.notFound("Audit log not found");
  }
  return sendSuccess(res, log);
});

export const exportLogs = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const result = await AuditService.getLogs({
    organizationId: orgId,
    actorId: req.query.actorId as string,
    module: req.query.module as string,
    action: req.query.action as any,
    targetId: req.query.targetId as string,
    targetType: req.query.targetType as string,
    fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
    toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    page: 1,
    limit: 10000
  });

  return sendSuccess(res, result.logs);
});
