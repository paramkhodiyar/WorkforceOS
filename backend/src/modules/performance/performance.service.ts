import { prisma } from "../../config/database";
import { AuditAction, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { aggregatePerformanceMetrics } from "../../db/queries/performance.queries";
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
    data: { subjectId: string; period: string; periodType: string; comments?: string },
    req?: any
  ) {
    const { startDate, endDate } = getDateRange(data.period, data.periodType);
    const metrics = await aggregatePerformanceMetrics(data.subjectId, startDate, endDate);

    const review = await prisma.performanceReview.create({
      data: {
        subjectId: data.subjectId,
        reviewerId,
        period: data.period,
        periodType: data.periodType,
        score: metrics.score,
        comments: data.comments || null,
        completionRate: metrics.completionRate,
        deadlinesMet: metrics.deadlinesMet,
        reworkCount: metrics.reworkCount,
        attendancePct: metrics.attendancePct
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
      "Performance Review Completed",
      `Your manager completed your performance review for ${data.period}. Score: ${metrics.score}`,
      { reviewId: review.id }
    );

    return review;
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

  static async getLeaderboard(orgId: string, departmentId?: string, period = "2026-Q1", type = "QUARTERLY") {
    const where: any = {
      organizationId: orgId,
      isDeleted: false,
      systemRole: "EMPLOYEE"
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({ where });
    const { startDate, endDate } = getDateRange(period, type);

    const scoresList = [];
    for (const u of users) {
      const metrics = await aggregatePerformanceMetrics(u.id, startDate, endDate);
      scoresList.push({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        score: metrics.score,
        completionRate: metrics.completionRate,
        attendancePct: metrics.attendancePct
      });
    }

    scoresList.sort((a, b) => b.score - a.score);
    return scoresList;
  }
}
