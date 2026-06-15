import { prisma } from "../../config/database";
import { AuditAction, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import {
  aggregatePerformanceMetrics,
  DEFAULT_WEIGHT_CONFIG,
  WeightConfig
} from "../../db/queries/performance.queries";
import { getDateRange } from "../../utils/date.util";

export class PerformanceService {
  static async getMetrics(userId: string, period: string, type: string) {
    const { startDate, endDate } = getDateRange(period, type);
    return aggregatePerformanceMetrics(userId, startDate, endDate);
  }

  static async listReviews(userId: string, isManager: boolean, period?: string, type?: string) {
    const where: any = { isDeleted: false };
    if (isManager) {
      where.reviewerId = userId;
    } else {
      where.subjectId = userId;
    }

    if (period) where.period = period;
    if (type) where.periodType = type;

    return prisma.performanceReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
  }

  static async createReview(
    orgId: string,
    reviewerId: string,
    data: {
      subjectId: string;
      period: string;
      periodType: string;
      comments?: string;
      weightConfig?: Partial<WeightConfig>;
    },
    req?: any
  ) {
    const { startDate, endDate } = getDateRange(data.period, data.periodType);
    const weights = { ...DEFAULT_WEIGHT_CONFIG, ...(data.weightConfig ?? {}) };
    const metrics = await aggregatePerformanceMetrics(data.subjectId, startDate, endDate, weights);

    const review = await prisma.performanceReview.create({
      data: {
        subjectId: data.subjectId,
        reviewerId,
        period: data.period,
        periodType: data.periodType,
        score: metrics.avgReviewScore,
        comments: data.comments ?? null,
        completionRate: metrics.completionRate,
        deadlinesMet: metrics.deadlinesMet,
        reworkCount: metrics.reworkCount,
        attendancePct: metrics.attendancePct,
        weightConfig: metrics.weights as unknown as Record<string, number>,
        finalScore: metrics.finalScore,
        scoreBand: metrics.scoreBand
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: reviewerId,
      action: AuditAction.CREATED,
      module: "performance",
      targetId: review.id,
      targetType: "PerformanceReview",
      req
    });

    await NotificationService.notify(
      data.subjectId,
      NotificationType.REVIEW_DUE,
      "Performance Review Created",
      `Your manager created a performance review for ${data.period}. Composite Score: ${metrics.finalScore} (${metrics.scoreBand})`,
      { reviewId: review.id }
    );

    return { ...review, metrics };
  }

  static async getReviewById(id: string, orgId: string) {
    const review = await prisma.performanceReview.findFirst({
      where: { id, isDeleted: false, subject: { organizationId: orgId } },
      include: {
        subject: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    if (!review) {
      throw AppError.notFound("Performance review not found");
    }

    return review;
  }

  static async updateReview(
    id: string,
    orgId: string,
    reviewerId: string,
    data: { comments?: string; score?: number },
    req?: any
  ) {
    const review = await prisma.performanceReview.findFirst({
      where: { id, isDeleted: false }
    });

    if (!review) {
      throw AppError.notFound("Performance review not found");
    }

    if (review.reviewerId !== reviewerId) {
      throw AppError.forbidden("Only the reviewer can update this review");
    }

    const updated = await prisma.performanceReview.update({
      where: { id },
      data
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: reviewerId,
      action: AuditAction.UPDATED,
      module: "performance",
      targetId: id,
      targetType: "PerformanceReview",
      oldValue: review,
      newValue: updated,
      req
    });

    return updated;
  }

  /**
   * HR submits qualitative feedback (0–5 per dimension) on a review.
   * After feedback is saved, the final composite score is recomputed and the
   * review is optionally published.
   */
  static async submitHrFeedback(
    id: string,
    orgId: string,
    hrId: string,
    data: {
      hrCollaboration: number;
      hrCommunication: number;
      hrDiscipline: number;
      hrInitiative: number;
      hrConduct: number;
      hrFeedbackNote?: string;
      publish?: boolean;
      weightConfig?: Partial<WeightConfig>;
    },
    req?: any
  ) {
    const review = await prisma.performanceReview.findFirst({
      where: { id, isDeleted: false, subject: { organizationId: orgId } }
    });

    if (!review) throw AppError.notFound("Performance review not found");

    const { startDate, endDate } = getDateRange(review.period, review.periodType);

    const hrFeedback = {
      hrCollaboration: data.hrCollaboration,
      hrCommunication: data.hrCommunication,
      hrDiscipline: data.hrDiscipline,
      hrInitiative: data.hrInitiative,
      hrConduct: data.hrConduct
    };

    const weights = {
      ...(review.weightConfig as Partial<WeightConfig> ?? DEFAULT_WEIGHT_CONFIG),
      ...(data.weightConfig ?? {})
    };

    const metrics = await aggregatePerformanceMetrics(
      review.subjectId,
      startDate,
      endDate,
      weights,
      hrFeedback
    );

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        hrCollaboration: data.hrCollaboration,
        hrCommunication: data.hrCommunication,
        hrDiscipline: data.hrDiscipline,
        hrInitiative: data.hrInitiative,
        hrConduct: data.hrConduct,
        hrFeedbackNote: data.hrFeedbackNote ?? null,
        hrFeedbackBy: hrId,
        hrFeedbackAt: new Date(),
        weightConfig: metrics.weights as unknown as Record<string, number>,
        finalScore: metrics.finalScore,
        scoreBand: metrics.scoreBand,
        isPublished: data.publish ?? false
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: hrId,
      action: AuditAction.UPDATED,
      module: "performance",
      targetId: id,
      targetType: "PerformanceReview",
      newValue: { finalScore: metrics.finalScore, scoreBand: metrics.scoreBand },
      req
    });

    if (data.publish) {
      await NotificationService.notify(
        review.subjectId,
        NotificationType.REVIEW_DUE,
        "Performance Review Published",
        `Your performance review for ${review.period} has been published. Final Score: ${metrics.finalScore} (${metrics.scoreBand})`,
        { reviewId: review.id }
      );
    }

    return { ...updated, metrics };
  }

  /**
   * Recalculate and persist the composite score for an existing review.
   * Useful after weight config changes.
   */
  static async recalculateScore(id: string, orgId: string, actorId: string, weightConfig?: Partial<WeightConfig>, req?: any) {
    const review = await prisma.performanceReview.findFirst({
      where: { id, isDeleted: false, subject: { organizationId: orgId } }
    });

    if (!review) throw AppError.notFound("Performance review not found");

    const { startDate, endDate } = getDateRange(review.period, review.periodType);
    const weights = { ...DEFAULT_WEIGHT_CONFIG, ...(weightConfig ?? {}) };

    const hrFeedback = {
      hrCollaboration: review.hrCollaboration,
      hrCommunication: review.hrCommunication,
      hrDiscipline: review.hrDiscipline,
      hrInitiative: review.hrInitiative,
      hrConduct: review.hrConduct
    };

    const metrics = await aggregatePerformanceMetrics(
      review.subjectId,
      startDate,
      endDate,
      weights,
      hrFeedback
    );

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        finalScore: metrics.finalScore,
        scoreBand: metrics.scoreBand,
        weightConfig: metrics.weights as unknown as Record<string, number>,
        completionRate: metrics.completionRate,
        deadlinesMet: metrics.deadlinesMet,
        reworkCount: metrics.reworkCount,
        attendancePct: metrics.attendancePct
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "performance",
      targetId: id,
      targetType: "PerformanceReview",
      newValue: { finalScore: metrics.finalScore, scoreBand: metrics.scoreBand },
      req
    });

    return { ...updated, metrics };
  }

  static async getLeaderboard(orgId: string, departmentId?: string, period = "2026-Q1", type = "QUARTERLY") {
    const where: any = {
      organizationId: orgId,
      isDeleted: false
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({ where, take: 100 });
    const { startDate, endDate } = getDateRange(period, type);

    const scoresList = await Promise.all(
      users.map(async (u) => {
        const metrics = await aggregatePerformanceMetrics(u.id, startDate, endDate);
        return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          avatarUrl: u.avatarUrl,
          designation: u.designation,
          finalScore: metrics.finalScore,
          scoreBand: metrics.scoreBand,
          completionRate: metrics.completionRate,
          attendancePct: metrics.attendancePct,
          qualityScore: metrics.qualityScore,
          deadlinesMet: metrics.deadlinesMet
        };
      })
    );

    scoresList.sort((a, b) => b.finalScore - a.finalScore);
    return scoresList;
  }
}
