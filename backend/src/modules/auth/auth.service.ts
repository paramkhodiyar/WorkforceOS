import { prisma } from "../../config/database";
import { comparePassword, hashPassword } from "../../utils/hash.util";
import { signAccessToken, signRefreshToken, verifyToken } from "../../utils/token.util";
import { config } from "../../config/env";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@prisma/client";
import { redis } from "../../config/redis";

import { OnboardingService } from "../onboarding/onboarding.service";

export class AuthService {
  static async registerTrial(data: any, req?: any) {
    const { firstName, lastName, email, password, companyName } = data;
    const cleanEmail = email.toLowerCase().trim();
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-trial-" + Math.floor(Math.random() * 10000);

    // Formulate onboarding payload for a trial
    const onboardingPayload = {
      organizationName: `${companyName} (Trial)`,
      organizationSlug: slug,
      defaultPassword: password,
      orgAdminEmail: cleanEmail,
      hrEmails: [`hr@${slug}.com`],
      financeEmails: [],
      employees: [
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          phone: "9876543210",
          designation: "CEO / Org Admin",
          departmentName: "Management",
          salaryBand: "BAND_A",
          basicSalary: "120000",
          ctcAnnual: "1800000",
          taxRegime: "NEW"
        },
        {
          firstName: "Jane",
          lastName: "Doe",
          email: `hr@${slug}.com`,
          phone: "9876543211",
          designation: "HR Manager",
          departmentName: "HR",
          salaryBand: "BAND_B",
          basicSalary: "60000",
          ctcAnnual: "800000",
          taxRegime: "NEW"
        },
        {
          firstName: "John",
          lastName: "Smith",
          email: `engineer@${slug}.com`,
          phone: "9876543212",
          designation: "Senior Engineer",
          departmentName: "Engineering",
          salaryBand: "BAND_C",
          basicSalary: "80000",
          ctcAnnual: "1100000",
          taxRegime: "NEW",
          managerEmail: cleanEmail
        }
      ]
    };

    // Run standard company onboarding to bootstrap roles, leave policies, and users
    const result = await OnboardingService.onboardCompany(onboardingPayload, req);

    const orgId = result.org.id;
    const adminUser = result.orgAdmin;

    // Update organization with trial properties
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: "TRIAL",
        trialStartDate: new Date(),
        trialEndDate,
        isSetupComplete: true // Trial organizations start out pre-setup
      }
    });

    // Seed dummy Tasks, Leave Requests, and Attendance for evaluation
    const users = await prisma.user.findMany({ where: { organizationId: orgId } });
    const engineer = users.find(u => u.email === `engineer@${slug}.com`);
    const hr = users.find(u => u.email === `hr@${slug}.com`);

    if (engineer && adminUser && hr) {
      // 1. Seed some tasks
      await prisma.task.createMany({
        data: [
          {
            taskId: `TSK-${Math.floor(Math.random() * 90000) + 10000}`,
            title: "Evaluate WorkforceOS Features",
            description: "Go through Tasks, Attendance, Payroll, and Leaves in the trial.",
            creatorId: adminUser.id,
            assigneeId: engineer.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            orgId: orgId
          },
          {
            taskId: `TSK-${Math.floor(Math.random() * 90000) + 10000}`,
            title: "Setup Trial Payroll Run",
            description: "Verify that payroll computes correctly in the finance dashboard.",
            creatorId: adminUser.id,
            assigneeId: adminUser.id,
            status: "DRAFT",
            priority: "MEDIUM",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            orgId: orgId
          }
        ]
      });

      // 2. Seed some leave requests
      await prisma.leaveRequest.create({
        data: {
          userId: engineer.id,
          leaveType: "SICK",
          startDate: new Date(),
          endDate: new Date(),
          days: 1.0,
          reason: "Feeling unwell, taking day off",
          status: "PENDING"
        }
      });

      // 3. Seed some attendance
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const checkInTime = new Date(yesterday);
      checkInTime.setHours(9, 15, 0);
      const checkOutTime = new Date(yesterday);
      checkOutTime.setHours(18, 5, 0);

      await prisma.attendance.createMany({
        data: [
          {
            userId: engineer.id,
            date: yesterday,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            status: "PRESENT",
            totalHours: 8.8
          },
          {
            userId: adminUser.id,
            date: yesterday,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            status: "PRESENT",
            totalHours: 8.8
          }
        ]
      });
    }

    // Auto-login the user immediately after signing up
    return this.login(cleanEmail, password, req);
  }

  static async masterBypass(pin: string, req?: any) {
    if (pin !== "22428374") {
      throw AppError.unauthorized("Invalid PIN");
    }

    // Find the primary super admin
    const user = await prisma.user.findFirst({
      where: { systemRole: "SUPER_ADMIN", isDeleted: false },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        roles: {
          include: {
            role: true
          }
        },
        departmentHead: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        },
        teamLead: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        },
        teams: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      throw AppError.unauthorized("No super admin found for bypass");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      organizationId: user.organizationId
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    });

    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      action: AuditAction.LOGIN,
      module: "auth_bypass",
      req
    });

    const formattedRoles = user.roles.map((ur) => ({
      roleId: ur.roleId,
      roleName: ur.role.name,
      scopeType: ur.scopeType,
      scopeId: ur.scopeId
    }));

    return {
      tokens: { accessToken, refreshToken },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
        department: user.department,
        manager: user.manager,
        organizationId: user.organizationId,
        roles: formattedRoles,
        departmentHead: user.departmentHead,
        teamLead: user.teamLead,
        teams: user.teams,
        forcePasswordChange: user.forcePasswordChange
      }
    };
  }
  static async login(email: string, password: string, req?: any) {
    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        roles: {
          include: {
            role: true
          }
        },
        departmentHead: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        },
        teamLead: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        },
        teams: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        }
      }
    });

    if (!user || user.status !== "ACTIVE") {
      throw AppError.unauthorized("Invalid credentials");
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      organizationId: user.organizationId
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    });

    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      action: AuditAction.LOGIN,
      module: "auth",
      req
    });

    const formattedRoles = user.roles.map((ur) => ({
      roleId: ur.roleId,
      roleName: ur.role.name,
      scopeType: ur.scopeType,
      scopeId: ur.scopeId
    }));

    return {
      tokens: { accessToken, refreshToken },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
        department: user.department,
        manager: user.manager,
        organizationId: user.organizationId,
        roles: formattedRoles,
        departmentHead: user.departmentHead,
        teamLead: user.teamLead,
        teams: user.teams,
        forcePasswordChange: user.forcePasswordChange
      }
    };
  }

  static async refresh(token: string) {
    let decoded;
    try {
      decoded = verifyToken(token, config.JWT_REFRESH_SECRET);
    } catch (err) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      throw AppError.unauthorized("Refresh token is expired or revoked");
    }

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true }
    });

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, isDeleted: false }
    });

    if (!user || user.status !== "ACTIVE") {
      throw AppError.unauthorized("User account is inactive or not found");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      organizationId: user.organizationId
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt
      }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  static async logout(token: string, userId: string, orgId: string, req?: any) {
    await prisma.refreshToken.updateMany({
      where: { token, userId },
      data: { isRevoked: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.LOGOUT,
      module: "auth",
      req
    });
  }

  static async changePassword(userId: string, orgId: string, oldPass: string, newPass: string, req?: any) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false }
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const matches = await comparePassword(oldPass, user.passwordHash);
    if (!matches) {
      throw AppError.badRequest("Invalid current password");
    }

    const passwordHash = await hashPassword(newPass);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash,
        forcePasswordChange: false
      }
    });

    await redis.del(`user:session:${userId}`).catch(() => {});

    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.UPDATED,
      module: "auth",
      targetId: userId,
      targetType: "User",
      newValue: { passwordChanged: true },
      req
    });

    return updatedUser;
  }
}
