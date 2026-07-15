import { Request, Response } from "express";
import { StatsService } from "./stats.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const getOperationsStats = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const stats = await StatsService.getOperationsStats(orgId);
  return sendSuccess(res, stats);
});

export const getEmployeeStats = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const userId = req.params.userId;
  const stats = await StatsService.getEmployeeStats(userId, orgId);
  return sendSuccess(res, stats);
});
