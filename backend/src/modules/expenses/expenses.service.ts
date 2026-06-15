import { prisma } from "../../config/database";
import { ExpenseStatus, AuditAction, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { getPermissionScopes } from "../../utils/permission.util";

export class ExpensesService {
  static async createClaim(userId: string, orgId: string, data: { title: string; category: string; amount: number; currency?: string; incurredOn: Date; description?: string }, req?: any) {
    const claim = await prisma.expenseClaim.create({
      data: {
        userId,
        title: data.title,
        category: data.category,
        amount: data.amount,
        currency: data.currency || "INR",
        incurredOn: new Date(data.incurredOn),
        description: data.description || null,
        status: ExpenseStatus.DRAFT
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.CREATED,
      module: "expenses",
      targetId: claim.id,
      targetType: "ExpenseClaim",
      req
    });

    return claim;
  }

  static async updateClaim(id: string, userId: string, orgId: string, data: any, req?: any) {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id, userId, isDeleted: false }
    });

    if (!claim) {
      throw AppError.notFound("Expense claim not found");
    }

    if (claim.status !== ExpenseStatus.DRAFT) {
      throw AppError.badRequest("Only draft claims can be updated");
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.UPDATED,
      module: "expenses",
      targetId: id,
      targetType: "ExpenseClaim",
      oldValue: claim,
      newValue: updated,
      req
    });

    return updated;
  }

  static async submitClaim(id: string, userId: string, orgId: string, req?: any) {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id, userId, isDeleted: false }
    });

    if (!claim) {
      throw AppError.notFound("Expense claim not found");
    }

    if (claim.status !== ExpenseStatus.DRAFT) {
      throw AppError.badRequest("Only draft claims can be submitted");
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: ExpenseStatus.SUBMITTED }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.STATUS_CHANGED,
      module: "expenses",
      targetId: id,
      targetType: "ExpenseClaim",
      newValue: { status: ExpenseStatus.SUBMITTED },
      req
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.managerId) {
      await NotificationService.notify(
        user.managerId,
        NotificationType.EXPENSE_APPROVED,
        "Expense Claim Submitted",
        `${user.firstName} ${user.lastName} submitted an expense claim of ${claim.amount} ${claim.currency}`,
        { expenseClaimId: id }
      );
    }

    return updated;
  }

  static async addAttachment(claimId: string, userId: string, fileUrl: string, fileName: string) {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id: claimId, userId, isDeleted: false }
    });

    if (!claim) {
      throw AppError.notFound("Expense claim not found");
    }

    return prisma.expenseAttachment.create({
      data: {
        expenseClaimId: claimId,
        fileUrl,
        fileName
      }
    });
  }

  static async getMyClaims(userId: string, filters: { status?: ExpenseStatus; fromDate?: Date; toDate?: Date }) {
    const where: any = { userId, isDeleted: false };
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.incurredOn = {};
      if (filters.fromDate) where.incurredOn.gte = filters.fromDate;
      if (filters.toDate) where.incurredOn.lte = filters.toDate;
    }

    return prisma.expenseClaim.findMany({
      where,
      orderBy: { incurredOn: "desc" },
      include: { attachments: true, approvals: true }
    });
  }

  static async getPendingApprovals(user: any, orgId: string) {
    const financeScopes = await getPermissionScopes(user, orgId, "expense", "approve:finance");
    const managerScopes = await getPermissionScopes(user, orgId, "expense", "approve:manager");

    const conditions: any[] = [];

    // Finance approval step (global only)
    if (financeScopes.isGlobal) {
      conditions.push({
        status: ExpenseStatus.MANAGER_APPROVED,
        user: { organizationId: orgId }
      });
    }

    // Manager approval step (global or scoped)
    if (managerScopes.isGlobal) {
      conditions.push({
        status: ExpenseStatus.SUBMITTED,
        user: { organizationId: orgId }
      });
    } else {
      const managerOrConditions: any[] = [];

      // Department scope
      if (managerScopes.departmentIds.length > 0) {
        managerOrConditions.push({
          user: { departmentId: { in: managerScopes.departmentIds } }
        });
      }

      // Team scope or direct reports
      if (managerScopes.teamIds.length > 0 || user.systemRole === "MANAGER" || user.systemRole === "DEPARTMENT_HEAD") {
        // Direct manager
        managerOrConditions.push({
          user: { managerId: user.id }
        });
        // Team scope
        if (managerScopes.teamIds.length > 0) {
          managerOrConditions.push({
            user: {
              teams: {
                some: { id: { in: managerScopes.teamIds } }
              }
            }
          });
        }
      }

      if (managerOrConditions.length > 0) {
        conditions.push({
          status: ExpenseStatus.SUBMITTED,
          user: {
            organizationId: orgId,
            OR: managerOrConditions
          }
        });
      }
    }

    if (conditions.length === 0) {
      return [];
    }

    const where: any = {
      isDeleted: false,
      OR: conditions
    };

    return prisma.expenseClaim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        attachments: true
      }
    });
  }

  static async approve(id: string, orgId: string, approverId: string, comment?: string, req?: any) {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id, isDeleted: false },
      include: { user: true }
    });

    if (!claim || claim.status !== ExpenseStatus.SUBMITTED) {
      throw AppError.badRequest("Claim not found or not in submitted state");
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: ExpenseStatus.MANAGER_APPROVED }
    });

    await prisma.expenseApproval.create({
      data: {
        expenseClaimId: id,
        approverId,
        action: "MANAGER_APPROVED",
        comment
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.APPROVED,
      module: "expenses",
      targetId: id,
      targetType: "ExpenseClaim",
      req
    });

    const financeUsers = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        roles: { some: { role: { name: "FINANCE_MANAGER" } } }
      }
    });

    for (const fin of financeUsers) {
      await NotificationService.notify(
        fin.id,
        NotificationType.EXPENSE_APPROVED,
        "Expense Claim Approved by Manager - Pending Finance Approval",
        `${claim.user.firstName} ${claim.user.lastName}'s claim for ${claim.amount} ${claim.currency} was approved by their manager, pending final Finance approval.`,
        { expenseClaimId: id }
      );
    }

    return updated;
  }

  static async financeApprove(id: string, orgId: string, approverId: string, comment?: string, req?: any) {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id, isDeleted: false }
    });

    if (!claim || claim.status !== ExpenseStatus.MANAGER_APPROVED) {
      throw AppError.badRequest("Claim not found or not approved by manager");
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: ExpenseStatus.FINANCE_APPROVED }
    });

    await prisma.expenseApproval.create({
      data: {
        expenseClaimId: id,
        approverId,
        action: "FINANCE_APPROVED",
        comment
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.APPROVED,
      module: "expenses",
      targetId: id,
      targetType: "ExpenseClaim",
      req
    });

    await NotificationService.notify(
      claim.userId,
      NotificationType.EXPENSE_APPROVED,
      "Expense Claim Approved by Finance",
      `Your expense claim of ${claim.amount} ${claim.currency} was approved by Finance. Payout will be processed.`,
      { expenseClaimId: id }
    );

    return updated;
  }

  static async markPaid(id: string, orgId: string, actorId: string, req?: any) {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id, isDeleted: false }
    });

    if (!claim || claim.status !== ExpenseStatus.FINANCE_APPROVED) {
      throw AppError.badRequest("Claim must be approved by Finance before payout");
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: ExpenseStatus.PAID }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.STATUS_CHANGED,
      module: "expenses",
      targetId: id,
      targetType: "ExpenseClaim",
      newValue: { status: ExpenseStatus.PAID },
      req
    });

    await NotificationService.notify(
      claim.userId,
      NotificationType.EXPENSE_APPROVED,
      "Expense Claim Paid",
      `Your expense claim of ${claim.amount} ${claim.currency} has been marked as paid.`,
      { expenseClaimId: id }
    );

    return updated;
  }

  static async reject(id: string, orgId: string, approverId: string, reason: string, req?: any) {
    const claim = await prisma.expenseClaim.findFirst({
      where: { id, isDeleted: false }
    });

    if (!claim || claim.status === ExpenseStatus.PAID || claim.status === ExpenseStatus.REJECTED || claim.status === ExpenseStatus.DRAFT) {
      throw AppError.badRequest("Claim cannot be rejected in its current state");
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: ExpenseStatus.REJECTED }
    });

    await prisma.expenseApproval.create({
      data: {
        expenseClaimId: id,
        approverId,
        action: "REJECTED",
        comment: reason
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.REJECTED,
      module: "expenses",
      targetId: id,
      targetType: "ExpenseClaim",
      req
    });

    await NotificationService.notify(
      claim.userId,
      NotificationType.EXPENSE_APPROVED,
      "Expense Claim Rejected",
      `Your expense claim of ${claim.amount} ${claim.currency} was rejected. Reason: ${reason}`,
      { expenseClaimId: id }
    );

    return updated;
  }
}
