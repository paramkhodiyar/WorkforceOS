import { Request, Response } from "express";
import { PerformanceService } from "./performance.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const period = req.query.period as string;
  const type = req.query.type as string;
  const metrics = await PerformanceService.getMetrics(userId, period, type);
  return sendSuccess(res, metrics);
});

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const period = req.query.period as string;
  const type = req.query.type as string;
  const isManager = req.query.isManager === "true";

  const reviews = await PerformanceService.listReviews(userId, isManager, period, type);
  return sendSuccess(res, reviews);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const reviewerId = req.user!.id;
  const review = await PerformanceService.createReview(orgId, reviewerId, req.body, req);
  return sendSuccess(res, review, "Performance review saved successfully");
});

export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const review = await PerformanceService.getReviewById(req.params.id, orgId);
  return sendSuccess(res, review);
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const reviewerId = req.user!.id;
  const review = await PerformanceService.updateReview(req.params.id, orgId, reviewerId, req.body, req);
  return sendSuccess(res, review, "Performance review updated successfully");
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const departmentId = req.query.departmentId as string;
  const period = req.query.period as string;
  const type = req.query.type as string;

  const board = await PerformanceService.getLeaderboard(orgId, departmentId, period, type);
  return sendSuccess(res, board);
});
