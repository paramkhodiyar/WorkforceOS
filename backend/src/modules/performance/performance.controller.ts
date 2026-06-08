import { Request, Response } from "express";
import { PerformanceService } from "./performance.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errors.util";

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const period = req.query.period as string;
  const type = req.query.type as string;

  if (req.user!.id !== userId) {
    const systemRole = req.user!.systemRole;
    const isAdmin = systemRole === "SUPER_ADMIN" || systemRole === "ORG_ADMIN";
    const userRoles = req.user!.roles || [];
    const isHR = userRoles.some((r: any) => r.roleName === "HR_MANAGER");
    const isManager = userRoles.some((r: any) => r.roleName === "TEAM_MANAGER" || r.roleName === "DEPARTMENT_HEAD");

    const targetUser = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false }
    });
    const isTargetManager = targetUser?.managerId === req.user!.id;

    if (!isAdmin && !isHR && !isManager && !isTargetManager) {
      throw AppError.forbidden("Access denied: insufficient permissions to view other employee's performance metrics");
    }
  }

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

  if (review.subjectId !== req.user!.id && review.reviewerId !== req.user!.id) {
    const systemRole = req.user!.systemRole;
    const isAdmin = systemRole === "SUPER_ADMIN" || systemRole === "ORG_ADMIN";
    const userRoles = req.user!.roles || [];
    const isHR = userRoles.some((r: any) => r.roleName === "HR_MANAGER");

    const targetUser = await prisma.user.findFirst({
      where: { id: review.subjectId, isDeleted: false }
    });
    const isTargetManager = targetUser?.managerId === req.user!.id;

    if (!isAdmin && !isHR && !isTargetManager) {
      throw AppError.forbidden("Access denied: insufficient permissions to view this performance review");
    }
  }

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
