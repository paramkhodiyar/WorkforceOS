import { Request, Response } from "express";
import { PerformanceService } from "./performance.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errors.util";
import { getPermissionScopes } from "../../utils/permission.util";

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const period = req.query.period as string;
  const type = req.query.type as string;

    const orgId = req.org!.id;
    const scopes = await getPermissionScopes(req.user!, orgId, "performance", "review:create");
    
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false }
    });
    const isTargetManager = targetUser?.managerId === req.user!.id;
    
    const isDeptHeadOfTarget = targetUser?.departmentId && scopes.departmentIds.includes(targetUser.departmentId);
    
    let isTeamLeadOfTarget = false;
    if (scopes.teamIds.length > 0) {
      const targetTeams = await prisma.team.findMany({
        where: { members: { some: { id: userId } }, isDeleted: false },
        select: { id: true }
      });
      isTeamLeadOfTarget = targetTeams.some(t => scopes.teamIds.includes(t.id));
    }

    if (!scopes.isGlobal && !isTargetManager && !isDeptHeadOfTarget && !isTeamLeadOfTarget) {
      throw AppError.forbidden("Access denied: insufficient permissions to view other employee's performance metrics");
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

    const orgScopes = await getPermissionScopes(req.user!, orgId, "performance", "read:org");
    const reviewScopes = await getPermissionScopes(req.user!, orgId, "performance", "review:create");

    const targetUser = await prisma.user.findFirst({
      where: { id: review.subjectId, isDeleted: false }
    });
    const isTargetManager = targetUser?.managerId === req.user!.id;

    const departmentIds = Array.from(new Set([...orgScopes.departmentIds, ...reviewScopes.departmentIds]));
    const teamIds = Array.from(new Set([...orgScopes.teamIds, ...reviewScopes.teamIds]));

    const isDeptHeadOfTarget = targetUser?.departmentId && departmentIds.includes(targetUser.departmentId);

    let isTeamLeadOfTarget = false;
    if (teamIds.length > 0) {
      const targetTeams = await prisma.team.findMany({
        where: { members: { some: { id: review.subjectId } }, isDeleted: false },
        select: { id: true }
      });
      isTeamLeadOfTarget = targetTeams.some(t => teamIds.includes(t.id));
    }

    const hasGlobalAccess = orgScopes.isGlobal || reviewScopes.isGlobal;
    const isSubject = review.subjectId === req.user!.id;
    const canSubjectView = isSubject && review.isPublished;

    if (!hasGlobalAccess && !isTargetManager && !isDeptHeadOfTarget && !isTeamLeadOfTarget && !canSubjectView) {
      throw AppError.forbidden("Access denied: insufficient permissions to view this performance review");
    }

  return sendSuccess(res, review);
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const reviewerId = req.user!.id;
  const review = await PerformanceService.updateReview(req.params.id, orgId, reviewerId, req.body, req);
  return sendSuccess(res, review, "Performance review updated successfully");
});

export const submitHrFeedback = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const hrId = req.user!.id;
  const result = await PerformanceService.submitHrFeedback(req.params.id, orgId, hrId, req.body, req);
  return sendSuccess(res, result, "HR feedback submitted and score recalculated successfully");
});

export const recalculateScore = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const result = await PerformanceService.recalculateScore(
    req.params.id,
    orgId,
    actorId,
    req.body.weightConfig,
    req
  );
  return sendSuccess(res, result, "Performance score recalculated successfully");
});

export const publishReview = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const result = await PerformanceService.publishReview(req.params.id, orgId, actorId, req);
  return sendSuccess(res, result, "Performance review published successfully");
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const departmentId = req.query.departmentId as string;
  const period = req.query.period as string;
  const type = req.query.type as string;

  const board = await PerformanceService.getLeaderboard(orgId, departmentId, period, type);
  return sendSuccess(res, board);
});

