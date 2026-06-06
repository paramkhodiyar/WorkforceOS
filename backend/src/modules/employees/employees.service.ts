import { prisma } from "../../config/database";
import { hashPassword } from "../../utils/hash.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { AuditAction, UserStatus, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";

export class EmployeesService {
  static async listEmployees(
    orgId: string,
    filters: { departmentId?: string; status?: UserStatus; search?: string },
    page: number,
    limit: number
  ) {
    const where: any = {
      organizationId: orgId,
      isDeleted: false
    };

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { employeeId: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    const total = await prisma.user.count({ where });
    const employees = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return { employees, total };
  }

  static async createEmployee(
    orgId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      avatarUrl?: string;
      designation?: string;
      departmentId?: string;
      managerId?: string;
      salaryBand?: string;
      joinDate?: Date;
    },
    actorId: string,
    req?: any
  ) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, isDeleted: false }
    });

    if (existing) {
      throw AppError.conflict("Email is already in use");
    }

    const year = new Date().getFullYear();
    const count = await prisma.user.count({
      where: {
        organizationId: orgId,
        employeeId: { startsWith: `EMP-${year}-` }
      }
    });
    const index = String(count + 1).padStart(4, "0");
    const employeeId = `EMP-${year}-${index}`;

    const tempPassword = `Temp-${year}-${Math.round(Math.random() * 10000)}`;
    const passwordHash = await hashPassword(tempPassword);

    const employee = await prisma.user.create({
      data: {
        ...data,
        employeeId,
        passwordHash,
        organizationId: orgId,
        status: UserStatus.ACTIVE
      }
    });

    const policies = await prisma.leavePolicy.findMany({
      where: { organizationId: orgId, isDeleted: false }
    });

    for (const policy of policies) {
      await prisma.leaveBalance.create({
        data: {
          userId: employee.id,
          leaveType: policy.leaveType,
          year,
          allocated: policy.daysAllowed,
          used: 0,
          pending: 0,
          remaining: policy.daysAllowed
        }
      });
    }

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.CREATED,
      module: "employees",
      targetId: employee.id,
      targetType: "User",
      newValue: { employeeId },
      req
    });

    await NotificationService.notify(
      employee.id,
      NotificationType.SYSTEM,
      "Welcome to WorkforceOS",
      `Your account has been created. Your temporary password is ${tempPassword}`
    );

    return { employee, tempPassword };
  }

  static async getEmployeeById(id: string, orgId: string) {
    const emp = await prisma.user.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teams: true,
        documents: {
          where: { isDeleted: false }
        },
        leaveBalances: true
      }
    });
    if (!emp) {
      throw AppError.notFound("Employee profile not found");
    }
    return emp;
  }

  static async updateEmployee(
    id: string,
    orgId: string,
    data: any,
    actorId: string,
    req?: any
  ) {
    const oldUser = await prisma.user.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!oldUser) {
      throw AppError.notFound("Employee profile not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    });

    const fields = ["firstName", "lastName", "email", "phone", "avatarUrl", "designation", "departmentId", "managerId", "salaryBand", "status"];
    for (const f of fields) {
      const oldVal = (oldUser as any)[f];
      const newVal = (updatedUser as any)[f];
      if (oldVal !== newVal) {
        await AuditService.log({
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "employees",
          targetId: id,
          targetType: "User",
          oldValue: { [f]: oldVal },
          newValue: { [f]: newVal },
          req
        });
      }
    }

    return updatedUser;
  }

  static async deleteEmployee(id: string, orgId: string, actorId: string, req?: any) {
    const emp = await prisma.user.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!emp) {
      throw AppError.notFound("Employee profile not found");
    }

    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { isRevoked: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.DELETED,
      module: "employees",
      targetId: id,
      targetType: "User",
      req
    });
  }

  static async uploadDocument(
    userId: string,
    orgId: string,
    name: string,
    fileUrl: string,
    fileType: string,
    uploadedBy: string
  ) {
    return prisma.employeeDocument.create({
      data: {
        userId,
        name,
        fileUrl,
        fileType,
        uploadedBy
      }
    });
  }

  static async listDocuments(userId: string) {
    return prisma.employeeDocument.findMany({
      where: { userId, isDeleted: false }
    });
  }

  static async deleteDocument(docId: string, userId: string) {
    return prisma.employeeDocument.update({
      where: { id: docId, userId },
      data: {
        isDeleted: true
      }
    });
  }
}
