import { prisma } from "../../config/database";
import { LeaveType, LeaveStatus, AuditAction, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { getPermissionScopes } from "../../utils/permission.util";

export class LeaveService {
  static async getBalance(userId: string, year: number) {
    return prisma.leaveBalance.findMany({
      where: { userId, year }
    });
  }

  static async apply(
    userId: string,
    orgId: string,
    data: { leaveType: LeaveType; startDate: Date; endDate: Date; reason: string },
    req?: any
  ) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start > end) {
      throw AppError.badRequest("Start date must be before or equal to end date");
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;

    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        isDeleted: false,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.MANAGER_APPROVED, LeaveStatus.HR_APPROVED] },
        startDate: { lte: end },
        endDate: { gte: start }
      }
    });

    if (overlap) {
      throw AppError.badRequest("Overlapping leave request exists");
    }

    const year = start.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: { userId_leaveType_year: { userId, leaveType: data.leaveType, year } }
    });

    if (!balance || balance.remaining < days) {
      throw AppError.badRequest("Insufficient leave balance");
    }

    const request = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType: data.leaveType,
        startDate: start,
        endDate: end,
        days,
        reason: data.reason,
        status: LeaveStatus.PENDING
      }
    });

    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        pending: { increment: days },
        remaining: { decrement: days }
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.CREATED,
      module: "leave",
      targetId: request.id,
      targetType: "LeaveRequest",
      req
    });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.managerId) {
      await NotificationService.notify(
        user.managerId,
        NotificationType.LEAVE_APPLIED,
        "Leave Application Received",
        `${user.firstName} ${user.lastName} applied for ${days} day(s) of ${data.leaveType} leave.`,
        { leaveRequestId: request.id }
      );
    }

    return request;
  }

  static async getMyRequests(userId: string, filters: { status?: LeaveStatus; leaveType?: LeaveType; year?: number }, page = 1, limit = 10) {
    const where: any = { userId, isDeleted: false };
    if (filters.status) where.status = filters.status;
    if (filters.leaveType) where.leaveType = filters.leaveType;
    if (filters.year) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59, 999);
      where.startDate = { gte: startOfYear, lte: endOfYear };
    }

    const total = await prisma.leaveRequest.count({ where });
    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        approvals: {
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    return { requests, total };
  }

  static async getPendingApprovals(user: any, orgId: string, page = 1, limit = 10) {
    const hrScopes = await getPermissionScopes(user, orgId, "leave", "approve:hr");
    const managerScopes = await getPermissionScopes(user, orgId, "leave", "approve:manager");

    const conditions: any[] = [];

    // HR Approval Step
    if (hrScopes.isGlobal) {
      conditions.push({
        status: LeaveStatus.MANAGER_APPROVED,
        user: { organizationId: orgId }
      });
    }

    // Manager Approval Step (Global/Org Scope)
    if (managerScopes.isGlobal) {
      conditions.push({
        status: LeaveStatus.PENDING,
        user: { organizationId: orgId }
      });
    } else {
      // Scoped Manager Approval
      const scopedOrConditions: any[] = [];

      // Department scope
      if (managerScopes.departmentIds.length > 0) {
        scopedOrConditions.push({
          user: { departmentId: { in: managerScopes.departmentIds } }
        });
      }

      // Team scope or Direct Reports (Manager)
      if (managerScopes.teamIds.length > 0 || user.systemRole === "MANAGER" || user.systemRole === "DEPARTMENT_HEAD") {
        // Direct manager reports
        scopedOrConditions.push({
          user: { managerId: user.id }
        });
        // Team member reports
        if (managerScopes.teamIds.length > 0) {
          scopedOrConditions.push({
            user: {
              teams: {
                some: { id: { in: managerScopes.teamIds } }
              }
            }
          });
        }
      }

      if (scopedOrConditions.length > 0) {
        conditions.push({
          status: LeaveStatus.PENDING,
          user: {
            organizationId: orgId,
            OR: scopedOrConditions
          }
        });
      }
    }

    if (conditions.length === 0) {
      return { requests: [], total: 0 };
    }

    const where: any = {
      isDeleted: false,
      userId: { not: user.id },
      OR: conditions
    };

    const total = await prisma.leaveRequest.count({ where });
    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, designation: true }
        }
      }
    });

    return { requests, total };
  }

  static async approve(orgId: string, id: string, approverId: string, comment?: string, req?: any) {
    const request = await prisma.leaveRequest.findFirst({
      where: { 
        id, 
        isDeleted: false,
        user: { organizationId: orgId }
      },
      include: { user: true }
    });

    if (!request || request.status !== LeaveStatus.PENDING) {
      throw AppError.badRequest("Leave request not found or not in pending state");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.MANAGER_APPROVED }
    });

    await prisma.leaveApproval.create({
      data: {
        leaveRequestId: id,
        approverId,
        action: "APPROVED",
        comment
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.APPROVED,
      module: "leave",
      targetId: id,
      targetType: "LeaveRequest",
      req
    });

    await NotificationService.notify(
      request.userId,
      NotificationType.LEAVE_APPROVED,
      "Leave Approved by Manager",
      `Your manager approved your leave request for ${request.days} day(s). Sent to HR for final sign-off.`,
      { leaveRequestId: id }
    );

    const hrUsers = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        roles: {
          some: {
            role: { name: "HR_MANAGER" }
          }
        }
      }
    });

    for (const hr of hrUsers) {
      await NotificationService.notify(
        hr.id,
        NotificationType.LEAVE_APPLIED,
        "Leave Approved by Manager - Pending HR Sign-off",
        `${request.user.firstName} ${request.user.lastName}'s leave application was approved by manager, pending final HR approval.`,
        { leaveRequestId: id }
      );
    }

    return updated;
  }

  static async hrApprove(orgId: string, id: string, approverId: string, comment?: string, req?: any) {
    const request = await prisma.leaveRequest.findFirst({
      where: { 
        id, 
        isDeleted: false,
        user: { organizationId: orgId }
      },
      include: { user: true }
    });

    if (!request || request.status !== LeaveStatus.MANAGER_APPROVED) {
      throw AppError.badRequest("Leave request not found or not approved by manager");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.HR_APPROVED }
    });

    await prisma.leaveApproval.create({
      data: {
        leaveRequestId: id,
        approverId,
        action: "APPROVED",
        comment
      }
    });

    const year = new Date(request.startDate).getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: { userId_leaveType_year: { userId: request.userId, leaveType: request.leaveType, year } }
    });

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: { decrement: request.days },
          used: { increment: request.days }
        }
      });
    }

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.APPROVED,
      module: "leave",
      targetId: id,
      targetType: "LeaveRequest",
      req
    });

    await NotificationService.notify(
      request.userId,
      NotificationType.LEAVE_APPROVED,
      "Leave Approved by HR",
      `HR has approved your leave request for ${request.days} day(s) of ${request.leaveType} leave. Enjoy your time off!`,
      { leaveRequestId: id }
    );

    return updated;
  }

  static async reject(orgId: string, id: string, approverId: string, comment: string, req?: any) {
    const request = await prisma.leaveRequest.findFirst({
      where: { 
        id, 
        isDeleted: false,
        user: { organizationId: orgId }
      }
    });

    if (!request || (request.status !== LeaveStatus.PENDING && request.status !== LeaveStatus.MANAGER_APPROVED)) {
      throw AppError.badRequest("Leave request cannot be rejected in its current state");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.REJECTED }
    });

    await prisma.leaveApproval.create({
      data: {
        leaveRequestId: id,
        approverId,
        action: "REJECTED",
        comment
      }
    });

    const year = new Date(request.startDate).getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: { userId_leaveType_year: { userId: request.userId, leaveType: request.leaveType, year } }
    });

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: { decrement: request.days },
          remaining: { increment: request.days }
        }
      });
    }

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.REJECTED,
      module: "leave",
      targetId: id,
      targetType: "LeaveRequest",
      req
    });

    await NotificationService.notify(
      request.userId,
      NotificationType.LEAVE_REJECTED,
      "Leave Application Rejected",
      `Your leave request has been rejected. Reason: ${comment}`,
      { leaveRequestId: id }
    );

    return updated;
  }

  static async cancel(userId: string, orgId: string, id: string, req?: any) {
    const request = await prisma.leaveRequest.findFirst({
      where: { id, userId, isDeleted: false }
    });

    if (!request || request.status !== LeaveStatus.PENDING) {
      throw AppError.badRequest("Only pending requests can be cancelled");
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED }
    });

    const year = new Date(request.startDate).getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: { userId_leaveType_year: { userId, leaveType: request.leaveType, year } }
    });

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: { decrement: request.days },
          remaining: { increment: request.days }
        }
      });
    }

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.STATUS_CHANGED,
      module: "leave",
      targetId: id,
      targetType: "LeaveRequest",
      newValue: { status: LeaveStatus.CANCELLED },
      req
    });

    return updated;
  }

  static async getCalendar(orgId: string, departmentId?: string, month?: number, year?: number) {
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const where: any = {
      status: LeaveStatus.HR_APPROVED,
      isDeleted: false,
      user: { organizationId: orgId },
      startDate: { lte: end },
      endDate: { gte: start }
    };

    if (departmentId) {
      where.user.departmentId = departmentId;
    }

    return prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  static async getPolicies(orgId: string) {
    return prisma.leavePolicy.findMany({
      where: { organizationId: orgId, isDeleted: false }
    });
  }

  static async updatePolicy(orgId: string, leaveType: LeaveType, daysAllowed: number, actorId: string, req?: any) {
    const existing = await prisma.leavePolicy.findUnique({
      where: { organizationId_leaveType: { organizationId: orgId, leaveType } }
    });

    let policy;
    if (existing) {
      policy = await prisma.leavePolicy.update({
        where: { id: existing.id },
        data: { daysAllowed }
      });
    } else {
      policy = await prisma.leavePolicy.create({
        data: {
          organizationId: orgId,
          leaveType,
          daysAllowed
        }
      });
    }

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "leave",
      targetId: policy.id,
      targetType: "LeavePolicy",
      oldValue: existing,
      newValue: policy,
      req
    });

    return policy;
  }
}
