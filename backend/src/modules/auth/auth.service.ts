import { prisma } from "../../config/database";
import { comparePassword, hashPassword } from "../../utils/hash.util";
import { signAccessToken, signRefreshToken, verifyToken } from "../../utils/token.util";
import { config } from "../../config/env";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@prisma/client";
import { redis } from "../../config/redis";
import { logger } from "../../config/logger";
import { randomBytes } from "crypto";

import { OnboardingService } from "../onboarding/onboarding.service";
import { sendTrialLeadEmails } from "../../utils/email.util";
import { generatePersonalizedLicenseKey } from "../license/license.util";
import { LicenseType, LicenseStatus } from "@prisma/client";

/**
 * Generates a random, policy-compliant password for trial accounts.
 * Format: 1 uppercase + 2 digits + 8 random mixed-case alphanum + 1 special char.
 */
function generateTrialPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const pool = upper + lower + digits;
  const bytes = randomBytes(12);
  let pwd =
    upper[bytes[0] % upper.length] +
    digits[bytes[1] % digits.length] +
    digits[bytes[2] % digits.length];
  for (let i = 3; i < 11; i++) {
    pwd += pool[bytes[i] % pool.length];
  }
  pwd += special[bytes[11] % special.length];
  return pwd;
}

export class AuthService {
  static async registerTrial(data: any, req?: any) {
    if (data.nickname && data.nickname.trim().length > 0) {
      throw AppError.badRequest("Spam detected");
    }
    const adminName = (data.adminName || `${data.firstName || ""} ${data.lastName || ""}`).trim();
    const [derivedFirstName, ...derivedLastNameParts] = adminName.split(/\s+/);
    const firstName = data.firstName || derivedFirstName || "Admin";
    const lastName = data.lastName || derivedLastNameParts.join(" ") || "User";
    const email = data.email || data.adminEmail;
    const password = data.password || generateTrialPassword();
    const companyName = data.companyName || data.organizationName;
    const companySize = data.companySize || "Not provided";
    const phone = data.phone || "Not provided";
    const challenge = data.challenge || "";
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
          phone,
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

    // Update organization with trial properties & personalized license key
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

    const { key, companyShort } = generatePersonalizedLicenseKey(companyName, "TRIAL", LicenseType.TRIAL);

    await prisma.licenseKey.create({
      data: {
        key,
        companyShort,
        tier: "STARTUP",
        type: LicenseType.TRIAL,
        status: LicenseStatus.ACTIVE,
        maxEmployees: 15,
        validityDays: 14,
        activatedAt: new Date(),
        activatedByOrgId: orgId,
        expiresAt: trialEndDate,
        notes: "Automated 14-day Trial License Key"
      }
    });

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: "TRIAL",
        subscriptionTier: "STARTUP",
        trialStartDate: new Date(),
        trialEndDate,
        licenseKey: key,
        licenseStatus: LicenseStatus.ACTIVE,
        licenseValidUntil: trialEndDate,
        licenseMaxEmployees: 15,
        isSetupComplete: true // Trial organizations start out pre-setup
      }
    });

    await sendTrialLeadEmails({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone,
      companyName,
      companySize,
      challenge,
      source: req?.body?.source || "7-day trial modal",
      submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    }).catch((error) => {
      console.error("Failed to send trial lead emails:", error);
    });

    // --- Comprehensive Trial Seed for Feature Evaluation ---
    const allUsers = await prisma.user.findMany({
      where: { organizationId: orgId, isDeleted: false }
    });
    const engineer = allUsers.find(u => u.email === `engineer@${slug}.com`);
    const hr = allUsers.find(u => u.email === `hr@${slug}.com`);

    // Helper to create a past date
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    if (engineer && adminUser && hr) {
      // -----------------------------------------------
      // 1. Add more demo employees for richer experience
      // -----------------------------------------------
      const demoEmployees = [
        {
          firstName: "Priya", lastName: "Sharma",
          email: `finance@${slug}.com`, phone: "9876543213",
          designation: "Finance Manager", departmentName: "Finance",
          salaryBand: "BAND_B", basicSalary: "70000", ctcAnnual: "960000", taxRegime: "OLD",
          managerEmail: adminUser.email
        },
        {
          firstName: "Rahul", lastName: "Verma",
          email: `design@${slug}.com`, phone: "9876543214",
          designation: "UI/UX Designer", departmentName: "Design",
          salaryBand: "BAND_C", basicSalary: "55000", ctcAnnual: "720000", taxRegime: "NEW",
          managerEmail: adminUser.email
        },
        {
          firstName: "Sneha", lastName: "Patel",
          email: `sales@${slug}.com`, phone: "9876543215",
          designation: "Sales Lead", departmentName: "Sales",
          salaryBand: "BAND_B", basicSalary: "65000", ctcAnnual: "900000", taxRegime: "NEW",
          managerEmail: adminUser.email
        },
        {
          firstName: "Arjun", lastName: "Kumar",
          email: `ops@${slug}.com`, phone: "9876543216",
          designation: "Operations Analyst", departmentName: "Operations",
          salaryBand: "BAND_D", basicSalary: "35000", ctcAnnual: "480000", taxRegime: "NEW",
          managerEmail: engineer.email
        }
      ];

      // Import OnboardingService to create more employees properly
      const { OnboardingService } = await import("../onboarding/onboarding.service");
      for (const emp of demoEmployees) {
        try {
          const dept = await prisma.department.findFirst({
            where: { name: emp.departmentName, organizationId: orgId }
          });
          const manager = await prisma.user.findFirst({
            where: { email: emp.managerEmail, organizationId: orgId }
          });
          const empPassword = generateTrialPassword();
          const { hashPassword: hashPw } = await import("../../utils/hash.util");
          const hashedPw = await hashPw(empPassword);
          await (prisma.user as any).create({
            data: {
              firstName: emp.firstName,
              lastName: emp.lastName,
              email: emp.email,
              phone: emp.phone,
              password: hashedPw,
              designation: emp.designation,
              departmentId: dept?.id,
              managerId: manager?.id,
              organizationId: orgId,
              systemRole: "EMPLOYEE",
              employeeId: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
              salaryBand: emp.salaryBand,
              basicSalary: parseFloat(emp.basicSalary),
              ctcAnnual: parseFloat(emp.ctcAnnual),
              taxRegime: emp.taxRegime,
              status: "ACTIVE",
              joinDate: daysAgo(Math.floor(Math.random() * 365 + 30))
            }
          });
        } catch (_) { /* skip if email already exists */ }
      }

      // Reload all users after creating extras
      const seedUsers = await prisma.user.findMany({
        where: { organizationId: orgId, isDeleted: false }
      });

      // -----------------------------------------------
      // 2. Bank details and emergency contacts
      // -----------------------------------------------
      const banks = ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"];
      const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "O-"];
      const genders = ["Male", "Female"];

      for (let i = 0; i < seedUsers.length; i++) {
        const u = seedUsers[i];
        const empNo = 1000 + i;
        try {
          const { encrypt } = await import("../../utils/encryption.util");
          await prisma.bankDetail.upsert({
            where: { userId: u.id },
            update: {},
            create: {
              userId: u.id,
              bankName: banks[i % banks.length],
              accountNumber: encrypt(`3${empNo}000000${empNo}`),
              ifscCode: `HDFC000${empNo}`,
              accountHolderName: `${u.firstName} ${u.lastName}`,
              panNumber: encrypt(`ABCDE${empNo}F`),
              aadhaarLast4: `${1000 + (i * 37) % 9000}`
            }
          });
        } catch (_) {}

        try {
          await prisma.emergencyContact.upsert({
            where: { userId: u.id },
            update: {},
            create: {
              userId: u.id,
              name: `Emergency Contact of ${u.firstName}`,
              relation: i % 2 === 0 ? "Spouse" : "Parent",
              phone: `98765${43210 + i}`,
              altPhone: `87654${32100 + i}`
            }
          });
        } catch (_) {}

        // Update basic profile fields
        await prisma.user.update({
          where: { id: u.id },
          data: {
            gender: genders[i % 2],
            bloodGroup: bloodGroups[i % bloodGroups.length],
            dateOfBirth: daysAgo(365 * (25 + (i * 3) % 15)),
            personalEmail: `${u.firstName.toLowerCase()}.personal@gmail.com`,
            personalPhone: `9999${100000 + i}`,
            address: {
              line1: `${i + 1}/${i + 10}, MG Road`,
              line2: "Sector 4",
              city: "Bengaluru",
              state: "Karnataka",
              pincode: `56000${i + 1}`,
              country: "India"
            }
          }
        }).catch(() => {});
      }

      // -----------------------------------------------
      // 3. 30-day attendance history for each employee
      // -----------------------------------------------
      const attendanceStatuses = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "HALF_DAY", "ABSENT", "PRESENT"] as const;

      for (const u of seedUsers) {
        const attendanceData = [];
        for (let day = 1; day <= 30; day++) {
          const date = daysAgo(day);
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

          const status = attendanceStatuses[day % attendanceStatuses.length];
          if (status === "ABSENT") {
            attendanceData.push({ userId: u.id, date, status: "ABSENT" as const, totalHours: 0 });
            continue;
          }

          const checkIn = new Date(date);
          checkIn.setHours(8 + (day % 2), 15 + (day % 30), 0);
          const checkOut = new Date(date);
          const hoursWorked = status === "HALF_DAY" ? 4.5 : 8 + (day % 2);
          checkOut.setHours(checkIn.getHours() + hoursWorked, 30, 0);

          attendanceData.push({
            userId: u.id,
            date,
            checkIn,
            checkOut,
            status: status === "HALF_DAY" ? "HALF_DAY" as const : "PRESENT" as const,
            totalHours: hoursWorked
          });
        }
        if (attendanceData.length > 0) {
          await prisma.attendance.createMany({ data: attendanceData, skipDuplicates: true });
        }
      }

      // -----------------------------------------------
      // 4. Leave requests — variety of types and statuses
      // -----------------------------------------------
      const leaveTypes = ["CASUAL", "SICK", "EARNED", "CASUAL", "SICK"] as const;
      const leaveStatuses = ["APPROVED", "APPROVED", "PENDING", "REJECTED", "PENDING"] as const;
      const leaveReasons = [
        "Family function attendance",
        "Medical checkup and recovery",
        "Personal work — bank KYC",
        "Visiting home town for festival",
        "Feeling unwell — fever and cold"
      ];

      for (let i = 0; i < seedUsers.length; i++) {
        const u = seedUsers[i];
        for (let j = 0; j < 3; j++) {
          const startDay = 5 + (i * 3) + (j * 7);
          const startDate = daysAgo(startDay);
          const endDate = daysAgo(startDay - 1);
          try {
            await prisma.leaveRequest.create({
              data: {
                userId: u.id,
                leaveType: leaveTypes[(i + j) % leaveTypes.length] as any,
                startDate,
                endDate,
                days: 1.0 + (j % 2) * 0.5,
                reason: leaveReasons[(i + j) % leaveReasons.length],
                status: leaveStatuses[(i + j) % leaveStatuses.length] as any
              }
            });
          } catch (_) {}
        }
      }

      // -----------------------------------------------
      // 5. Tasks & Nested Subtasks
      // -----------------------------------------------
      const taskTitles = [
        {
          title: "Setup Payroll Configuration", priority: "HIGH", status: "IN_PROGRESS",
          subtasks: [
            "Configure HRA and PF statutory default percentages",
            "Verify LOP auto-deduction calculation logic",
            "Generate sample payslip pre-disbursement preview"
          ]
        },
        {
          title: "Evaluate WorkforceOS Attendance Module", priority: "HIGH", status: "IN_PROGRESS",
          subtasks: [
            "Test geofence GPS check-in from mobile browser",
            "Submit WFH attendance adjustment request"
          ]
        },
        {
          title: "Review HR Policies and Leave Structure", priority: "MEDIUM", status: "IN_PROGRESS",
          subtasks: [
            "Verify 12-day Annual Leave quota allocation",
            "Publish corporate notice on Knowledge Base"
          ]
        },
        {
          title: "Onboard New Employee Checklist", priority: "MEDIUM", status: "COMPLETED",
          subtasks: [
            "Issue hardware asset (MacBook Pro)",
            "Setup employee bank details & emergency contact"
          ]
        },
        {
          title: "Audit Attendance & Ops Telemetry Data", priority: "LOW", status: "COMPLETED", subtasks: []
        },
      ];

      for (let i = 0; i < taskTitles.length; i++) {
        const t = taskTitles[i];
        const assignee = seedUsers[i % seedUsers.length];
        try {
          const parentTask = await prisma.task.create({
            data: {
              taskId: `TSK-${10000 + i}`,
              title: t.title,
              description: `Trial evaluation task: ${t.title}. Explore WorkforceOS management workflows.`,
              creatorId: adminUser.id,
              assigneeId: assignee.id,
              status: t.status as any,
              priority: t.priority as any,
              dueDate: new Date(Date.now() + (3 + i) * 24 * 60 * 60 * 1000),
              orgId: orgId
            }
          });

          // Seed nested subtasks for parent task
          if (t.subtasks && t.subtasks.length > 0) {
            for (let sIdx = 0; sIdx < t.subtasks.length; sIdx++) {
              const subTitle = t.subtasks[sIdx];
              await prisma.task.create({
                data: {
                  taskId: `SUB-${10000 + i}-${sIdx + 1}`,
                  title: subTitle,
                  description: `Subtask requirement for ${t.title}`,
                  creatorId: adminUser.id,
                  assigneeId: assignee.id,
                  parentTaskId: parentTask.id,
                  status: sIdx % 2 === 0 ? "IN_PROGRESS" : "DRAFT",
                  priority: t.priority as any,
                  dueDate: new Date(Date.now() + (2 + sIdx) * 24 * 60 * 60 * 1000),
                  orgId: orgId
                }
              }).catch(() => {});
            }
          }
        } catch (_) {}
      }

      // -----------------------------------------------
      // 6. Expenses Claims
      // -----------------------------------------------
      const expenseTypes = ["TRAVEL", "SOFTWARE", "CLIENT_DINNER", "OFFICE_SUPPLIES"];
      const expenseAmounts = [4500, 12900, 3200, 1850];
      for (let i = 0; i < seedUsers.length; i++) {
        const u = seedUsers[i];
        try {
          await (prisma as any).expenseClaim.create({
            data: {
              claimId: `EXP-${2000 + i}`,
              userId: u.id,
              organizationId: orgId,
              title: `${expenseTypes[i % expenseTypes.length].replace('_', ' ')} Reimbursement`,
              category: expenseTypes[i % expenseTypes.length],
              amount: expenseAmounts[i % expenseAmounts.length],
              status: i % 2 === 0 ? "APPROVED" : "PENDING",
              description: `Expense claim for ${expenseTypes[i % expenseTypes.length].toLowerCase()} during business operations.`
            }
          }).catch(() => {});
        } catch (_) {}
      }

      // -----------------------------------------------
      // 7. Hardware Assets
      // -----------------------------------------------
      const assetItems = [
        { name: "MacBook Pro 16\" M3", category: "LAPTOP", serialNumber: `MBP-2026-${orgId.slice(0, 4)}-01` },
        { name: "Dell UltraSharp 27\" Monitor", category: "MONITOR", serialNumber: `DELL-2026-${orgId.slice(0, 4)}-02` },
        { name: "Ergonomic Office Chair", category: "FURNITURE", serialNumber: `CHAIR-2026-${orgId.slice(0, 4)}-03` },
        { name: "iPhone 15 Test Device", category: "MOBILE", serialNumber: `IPH-2026-${orgId.slice(0, 4)}-04` }
      ];
      for (let i = 0; i < assetItems.length; i++) {
        const item = assetItems[i];
        const assignee = seedUsers[i % seedUsers.length];
        try {
          await (prisma as any).asset.create({
            data: {
              assetTag: `AST-${5000 + i}`,
              name: item.name,
              category: item.category,
              serialNumber: item.serialNumber,
              organizationId: orgId,
              assignedToUserId: assignee.id,
              status: "ASSIGNED"
            }
          }).catch(() => {});
        } catch (_) {}
      }

      // -----------------------------------------------
      // 8. Knowledge Articles & Notices
      // -----------------------------------------------
      const notices = [
        {
          title: "Welcome to WorkforceOS Trial Workspace",
          content: "Welcome! Your 7-day trial workspace is fully pre-configured. Explore Attendance, Leave Requests, Payroll Pre-Disbursement Preview, Tasks, and Workplace Settings.",
          isPinned: true
        },
        {
          title: "Hybrid Work & Geofenced Attendance Policy",
          content: "Employees can mark attendance within 200m of the office geofence coordinates or submit Work-From-Home adjustment requests.",
          isPinned: false
        }
      ];
      for (const n of notices) {
        try {
          await (prisma as any).knowledgeArticle.create({
            data: {
              title: n.title,
              content: n.content,
              authorId: adminUser.id,
              organizationId: orgId,
              isPinned: n.isPinned,
              category: "ANNOUNCEMENT"
            }
          }).catch(() => {});
        } catch (_) {}
      }
    }


    // Auto-login the user immediately after signing up
    return this.login(cleanEmail, password, req);
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
      logger.warn(`Security Event: Failed login attempt for email '${email}' - user not found or inactive`);
      throw AppError.unauthorized("Invalid credentials");
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      logger.warn(`Security Event: Failed login attempt for email '${email}' - incorrect password`);
      throw AppError.unauthorized("Invalid credentials");
    }

    if (user.systemRole !== "SYS_OWNER" && user.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
      if (org && org.subscriptionStatus === "TRIAL" && org.trialEndDate && new Date(org.trialEndDate) < new Date()) {
        throw AppError.forbidden("Your 7-day workspace trial has expired. Please contact your administrator or upgrade your subscription to reactivate access.");
      }
    }

    const payload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      organizationId: user.organizationId,
      originalRole: user.systemRole === "SYS_OWNER" ? "SYS_OWNER" : undefined
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
      organizationId: user.organizationId,
      originalRole: user.systemRole === "SYS_OWNER" ? "SYS_OWNER" : undefined
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

  static async switchRole(userId: string, selectedRole: string, currentPayload: any) {
    if (currentPayload.originalRole !== "SYS_OWNER") {
      throw AppError.forbidden("Only the system owner is authorized to switch roles dynamically");
    }

    const allowedRoles = ["ORG_ADMIN", "HR", "EMPLOYEE"];
    if (!allowedRoles.includes(selectedRole)) {
      throw AppError.badRequest("Invalid target role for owner simulation");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      systemRole: selectedRole,
      organizationId: user.organizationId,
      originalRole: "SYS_OWNER"
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

    // Clear session cache to force reload in authenticate middleware
    await redis.del(`user:session:${userId}`).catch(() => {});

    return {
      tokens: { accessToken, refreshToken },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: selectedRole,
        organizationId: user.organizationId,
        originalRole: "SYS_OWNER"
      }
    };
  }

  static async dismissWelcome(userId: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { hasSeenWelcome: true }
    });
    await redis.del(`user:session:${userId}`).catch(() => {});
    return updated;
  }
}
