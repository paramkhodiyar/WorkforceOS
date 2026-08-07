import { prisma } from "../../config/database";
import { hashPassword } from "../../utils/hash.util";
import { AuditService } from "../audit/audit.service";
import { AuditAction, UserStatus, SystemRole, LeaveType, RoleScope } from "@prisma/client";
import { AppError } from "../../utils/errors.util";

export class OnboardingService {
  static async onboardCompany(data: any, req?: any) {
    const slug = data.organizationSlug.toLowerCase().trim();
    const orgName = data.organizationName.trim();
    const defaultPassword = data.defaultPassword;
    const employees = data.employees;
    const orgAdminEmail = data.orgAdminEmail.toLowerCase().trim();
    const hrEmails = (data.hrEmails || []).map((e: string) => e.toLowerCase().trim());
    const financeEmails = (data.financeEmails || []).map((e: string) => e.toLowerCase().trim());

    // 1. Check if organization slug is already in use
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    });
    if (existingOrg) {
      throw AppError.conflict("An organization with this slug already exists.");
    }

    // 2. Check if any email is already in use in the system (across active users)
    const emailsToCheck = employees.map((e: any) => e.email.toLowerCase().trim());
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: emailsToCheck },
        isDeleted: false
      }
    });
    if (existingUsers.length > 0) {
      const activeEmails = existingUsers.map(u => u.email).join(", ");
      throw AppError.conflict(`The following email(s) are already registered: ${activeEmails}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 3. Create the Organization
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          logoUrl: data.logoUrl || null,
          isActive: true,
          enabledFeatures: [
            "employees",
            "attendance",
            "leave",
            "tasks",
            "performance",
            "payroll",
            "expenses",
            "assets",
            "knowledge",
            "notifications",
            "audit",
            "calendar",
            "org-canvas"
          ]
        }
      });

      // 4. Seed Standard Role Templates and Permissions for this Organization
      const rolesData = [
        {
          name: "HR_MANAGER",
          permissions: [
            { resource: "employee", actions: ["create", "read", "update", "delete", "approve"] },
            { resource: "leave", actions: ["read", "approve", "hr_approve", "manage_policy"] },
            { resource: "attendance", actions: ["read", "read_team", "adjust", "exceptions"] },
            { resource: "performance", actions: ["read", "review", "leaderboard", "hr-feedback"] },
            { resource: "expense", actions: ["read", "approve"] },
            { resource: "asset", actions: ["create", "read", "update", "delete", "assign"] },
            { resource: "knowledge", actions: ["create", "read", "update", "delete", "publish"] }
          ]
        },
        {
          name: "FINANCE_MANAGER",
          permissions: [
            { resource: "payroll", actions: ["read", "generate", "approve", "mark_paid"] },
            { resource: "expense", actions: ["read", "approve", "finance_approve"] }
          ]
        },
        {
          name: "DEPARTMENT_HEAD",
          permissions: [
            { resource: "employee", actions: ["read"] },
            { resource: "leave", actions: ["read", "approve"] },
            { resource: "performance", actions: ["read", "review", "leaderboard"] },
            { resource: "attendance", actions: ["read_team"] }
          ]
        },
        {
          name: "TEAM_MANAGER",
          permissions: [
            { resource: "employee", actions: ["read"] },
            { resource: "task", actions: ["create", "read", "update", "delete", "assign", "close", "review"] },
            { resource: "leave", actions: ["read", "approve"] },
            { resource: "attendance", actions: ["read_team"] }
          ]
        },
        {
          name: "EMPLOYEE",
          permissions: [
            { resource: "task", actions: ["read", "accept", "submit", "resubmit", "comment", "attachment", "create", "update"] },
            { resource: "leave", actions: ["read", "apply", "cancel"] },
            { resource: "attendance", actions: ["read", "check_in", "check_out", "break_start", "break_end"] },
            { resource: "expense", actions: ["read", "create"] },
            { resource: "knowledge", actions: ["read"] }
          ]
        },
        {
          name: "AUDITOR",
          permissions: [
            { resource: "audit", actions: ["read"] },
            { resource: "payroll", actions: ["read"] },
            { resource: "attendance", actions: ["read"] },
            { resource: "task", actions: ["read"] },
            { resource: "leave", actions: ["read"] }
          ]
        },
        {
          name: "INTERN",
          permissions: [
            { resource: "task", actions: ["read", "accept", "submit", "resubmit", "comment"] },
            { resource: "knowledge", actions: ["read"] },
            { resource: "attendance", actions: ["read", "check_in", "check_out"] }
          ]
        }
      ];

      const rolesMap: Record<string, string> = {};

      for (const roleData of rolesData) {
        const role = await tx.role.create({
          data: {
            name: roleData.name,
            organizationId: org.id,
            isSystem: false,
            isTemplate: true
          }
        });
        rolesMap[roleData.name] = role.id;

        for (const perm of roleData.permissions) {
          for (const act of perm.actions) {
            await tx.rolePermission.create({
              data: {
                roleId: role.id,
                organizationId: org.id,
                resource: perm.resource,
                action: act
              }
            });
          }
        }
      }

      // 5. Seed Standard Leave Policies for the new Organization
      const leavePolicies = [
        { leaveType: LeaveType.SICK, daysAllowed: 10 },
        { leaveType: LeaveType.CASUAL, daysAllowed: 12 },
        { leaveType: LeaveType.EARNED, daysAllowed: 15 },
        { leaveType: LeaveType.WFH, daysAllowed: 30 }
      ];

      for (const policy of leavePolicies) {
        await tx.leavePolicy.create({
          data: {
            organizationId: org.id,
            leaveType: policy.leaveType,
            daysAllowed: policy.daysAllowed,
            carryForward: policy.leaveType === LeaveType.EARNED,
            maxCarryForward: policy.leaveType === LeaveType.EARNED ? 5 : 0
          }
        });
      }

      // 6. Seed a Default Shift Configuration
      const shift = await tx.shiftConfig.create({
        data: {
          organizationId: org.id,
          name: "General Shift",
          checkInStart: "09:00",
          checkInDeadline: "10:00",
          checkOutMin: "18:00",
          breakMaxMins: 60,
          workingHoursMin: 8.0,
          isDefault: true
        }
      });

      // 7. Create Departments (extracted from employee list)
      const uniqueDepts: string[] = Array.from(
        new Set(
          employees
            .map((e: any) => e.departmentName?.trim())
            .filter((name: any): name is string => typeof name === "string" && name.length > 0)
        )
      );

      const deptsMap: Record<string, string> = {};
      for (const deptName of uniqueDepts) {
        const dept = await tx.department.create({
          data: {
            name: deptName,
            organizationId: org.id
          }
        });
        deptsMap[deptName.toLowerCase()] = dept.id;
      }

      // 8. Hash Password and Create Employees
      const passwordHash = await hashPassword(defaultPassword);
      const emailToUserMap: Record<string, any> = {};
      const year = new Date().getFullYear();

      // Get global count of employees to avoid unique ID collision
      const baseCount = await tx.user.count({
        where: {
          employeeId: { startsWith: `EMP-${year}-` }
        },
        ignoreSoftDelete: true
      } as any);

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const email = emp.email.toLowerCase().trim();

        // Assign globally unique Employee ID
        let employeeId = "";
        let index = baseCount + i + 1;
        let foundUnique = false;
        while (!foundUnique) {
          employeeId = `EMP-${year}-${String(index).padStart(4, "0")}`;
          const existingUserWithId = await tx.user.findFirst({
            where: { employeeId, isDeleted: false }
          });
          if (!existingUserWithId) {
            foundUnique = true;
          } else {
            index++;
          }
        }

        // Determine Role
        let systemRole: SystemRole = SystemRole.EMPLOYEE;
        if (email === orgAdminEmail) {
          systemRole = SystemRole.ORG_ADMIN;
        } else if (hrEmails.includes(email)) {
          systemRole = SystemRole.HR;
        } else if (financeEmails.includes(email)) {
          systemRole = SystemRole.FINANCE;
        }

        const deptId = emp.departmentName ? deptsMap[emp.departmentName.trim().toLowerCase()] : null;

        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName: emp.firstName.trim(),
            lastName: emp.lastName.trim(),
            phone: emp.phone ? String(emp.phone).trim() : null,
            designation: emp.designation ? emp.designation.trim() : null,
            organizationId: org.id,
            departmentId: deptId,
            systemRole,
            salaryBand: emp.salaryBand || null,
            basicSalary: emp.basicSalary ? parseFloat(emp.basicSalary) : null,
            ctcAnnual: emp.ctcAnnual ? parseFloat(emp.ctcAnnual) : null,
            taxRegime: emp.taxRegime || "NEW",
            shiftId: shift.id,
            status: UserStatus.ACTIVE,
            employeeId,
            forcePasswordChange: false
          }
        });

        emailToUserMap[email] = user;

        // Initialize Leave Balances
        for (const policy of leavePolicies) {
          await tx.leaveBalance.create({
            data: {
              userId: user.id,
              leaveType: policy.leaveType,
              year,
              allocated: policy.daysAllowed,
              used: 0,
              pending: 0,
              remaining: policy.daysAllowed
            }
          });
        }

        // Link UserRoles
        // All users get the Employee Role
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: rolesMap.EMPLOYEE,
            scopeType: RoleScope.ORG,
            scopeId: org.id
          }
        });

        // Orgs get HR Manager or Finance Manager roles accordingly
        if (email === orgAdminEmail || hrEmails.includes(email)) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: rolesMap.HR_MANAGER,
              scopeType: RoleScope.ORG,
              scopeId: org.id
            }
          });
        }

        if (financeEmails.includes(email)) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: rolesMap.FINANCE_MANAGER,
              scopeType: RoleScope.ORG,
              scopeId: org.id
            }
          });
        }
      }

      // 9. Resolve Manager Mapping
      for (const emp of employees) {
        const email = emp.email.toLowerCase().trim();
        const managerEmail = emp.managerEmail?.toLowerCase().trim();

        if (managerEmail && managerEmail !== email) {
          const managerUser = emailToUserMap[managerEmail];
          const reportUser = emailToUserMap[email];

          if (managerUser && reportUser) {
            // Update report manager pointer
            await tx.user.update({
              where: { id: reportUser.id },
              data: { managerId: managerUser.id }
            });

            // Assign Manager to TEAM_MANAGER role if not already assigned
            const existingMgrRole = await tx.userRole.findFirst({
              where: {
                userId: managerUser.id,
                roleId: rolesMap.TEAM_MANAGER
              }
            });

            if (!existingMgrRole) {
              await tx.userRole.create({
                data: {
                  userId: managerUser.id,
                  roleId: rolesMap.TEAM_MANAGER,
                  scopeType: RoleScope.ORG,
                  scopeId: org.id
                }
              });
            }
          }
        }
      }

      return { org, orgAdmin: emailToUserMap[orgAdminEmail] };
    }, {
      timeout: 60000
    });

    // 10. Audit Logging
    await AuditService.log({
      organizationId: result.org.id,
      actorId: result.orgAdmin.id,
      action: AuditAction.CREATED,
      module: "organization",
      targetId: result.org.id,
      targetType: "Organization",
      newValue: {
        name: result.org.name,
        slug: result.org.slug,
        employeesImported: employees.length
      },
      req
    });

    return result;
  }

  static async parseEmployeesExcel(fileBuffer: Buffer) {
    const XLSX = require("xlsx");
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

    // Normalize keys helper
    const getVal = (row: any, keys: string[]) => {
      for (const k of keys) {
        // Try exact match or lowercased/whitespace-stripped match
        const foundKey = Object.keys(row).find(
          rk => rk.toLowerCase().replace(/[^a-z0-9]+/g, "") === k.toLowerCase().replace(/[^a-z0-9]+/g, "")
        );
        if (foundKey) return row[foundKey];
      }
      return undefined;
    };

    const parsedEmployees = rawRows.map((row) => {
      return {
        firstName: String(getVal(row, ["First Name", "firstName", "first_name", "fname"]) || "").trim(),
        lastName: String(getVal(row, ["Last Name", "lastName", "last_name", "lname"]) || "").trim(),
        email: String(getVal(row, ["Email", "email", "email_address"]) || "").trim().toLowerCase(),
        phone: String(getVal(row, ["Phone", "phone_number", "phone", "mobile", "contact"]) || "").trim(),
        designation: String(getVal(row, ["Designation", "designation", "title", "role"]) || "").trim(),
        departmentName: String(getVal(row, ["Department", "department", "dept", "dept_name"]) || "").trim(),
        salaryBand: String(getVal(row, ["Salary Band", "salaryBand", "band"]) || "BAND_C").trim().toUpperCase(),
        basicSalary: String(getVal(row, ["Basic Salary", "basicSalary", "basic"]) || "40000").trim(),
        ctcAnnual: String(getVal(row, ["Annual CTC", "ctcAnnual", "ctc"]) || "480000").trim(),
        taxRegime: String(getVal(row, ["Tax Regime", "taxRegime", "regime"]) || "NEW").trim().toUpperCase(),
        managerEmail: String(getVal(row, ["Manager Email", "managerEmail", "manager"]) || "").trim().toLowerCase()
      };
    }).filter(emp => emp.firstName && emp.email); // Must have at least name and email to be valid

    return parsedEmployees;
  }

  static async setupExistingCompany(orgId: string, adminUserId: string, data: any, req?: any) {
    const slug = data.organizationSlug.toLowerCase().trim();
    const orgName = data.organizationName.trim();
    const defaultPassword = data.defaultPassword;
    const employees = data.employees;
    const orgAdminEmail = data.orgAdminEmail.toLowerCase().trim();
    const hrEmails = (data.hrEmails || []).map((e: string) => e.toLowerCase().trim());
    const financeEmails = (data.financeEmails || []).map((e: string) => e.toLowerCase().trim());

    // Check if slug is taken by ANOTHER organization
    const existingOrgWithSlug = await prisma.organization.findFirst({
      where: { slug, id: { not: orgId } }
    });
    if (existingOrgWithSlug) {
      throw AppError.conflict("An organization with this slug already exists.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the Organization
      const org = await tx.organization.update({
        where: { id: orgId },
        data: {
          name: orgName,
          slug,
          logoUrl: data.logoUrl || null,
          isSetupComplete: true
        }
      });

      // 2. Clear out any previous non-admin users/roles/policies/departments
      const users = await tx.user.findMany({ where: { organizationId: orgId } });
      const nonAdminIds = users.filter(u => u.id !== adminUserId).map(u => u.id);

      if (nonAdminIds.length > 0) {
        await tx.attendance.deleteMany({ where: { userId: { in: nonAdminIds } } });
        await tx.leaveRequest.deleteMany({ where: { userId: { in: nonAdminIds } } });
        await tx.leaveBalance.deleteMany({ where: { userId: { in: nonAdminIds } } });
        await tx.userRole.deleteMany({ where: { userId: { in: nonAdminIds } } });
        await tx.refreshToken.deleteMany({ where: { userId: { in: nonAdminIds } } });
        await tx.task.deleteMany({ where: { assigneeId: { in: nonAdminIds } } });
        await tx.user.deleteMany({ where: { id: { in: nonAdminIds } } });
      }

      await tx.task.deleteMany({ where: { orgId } });
      await tx.department.deleteMany({ where: { organizationId: orgId } });
      await tx.rolePermission.deleteMany({ where: { organizationId: orgId } });
      await tx.role.deleteMany({ where: { organizationId: orgId } });
      await tx.leavePolicy.deleteMany({ where: { organizationId: orgId } });
      await tx.shiftConfig.deleteMany({ where: { organizationId: orgId } });

      // 3. Seed Standard Role Templates and Permissions for this Organization
      const rolesData = [
        {
          name: "HR_MANAGER",
          permissions: [
            { resource: "employee", actions: ["create", "read", "update", "delete", "approve"] },
            { resource: "leave", actions: ["read", "approve", "hr_approve", "manage_policy"] },
            { resource: "attendance", actions: ["read", "read_team", "adjust", "exceptions"] },
            { resource: "performance", actions: ["read", "review", "leaderboard", "hr-feedback"] },
            { resource: "expense", actions: ["read", "approve"] },
            { resource: "asset", actions: ["create", "read", "update", "delete", "assign"] },
            { resource: "knowledge", actions: ["create", "read", "update", "delete", "publish"] }
          ]
        },
        {
          name: "FINANCE_MANAGER",
          permissions: [
            { resource: "payroll", actions: ["read", "generate", "approve", "mark_paid"] },
            { resource: "expense", actions: ["read", "approve", "finance_approve"] }
          ]
        },
        {
          name: "DEPARTMENT_HEAD",
          permissions: [
            { resource: "employee", actions: ["read"] },
            { resource: "leave", actions: ["read", "approve"] },
            { resource: "performance", actions: ["read", "review", "leaderboard"] },
            { resource: "attendance", actions: ["read_team"] }
          ]
        },
        {
          name: "TEAM_MANAGER",
          permissions: [
            { resource: "employee", actions: ["read"] },
            { resource: "task", actions: ["create", "read", "update", "delete", "assign", "close", "review"] },
            { resource: "leave", actions: ["read", "approve"] },
            { resource: "attendance", actions: ["read_team"] }
          ]
        },
        {
          name: "EMPLOYEE",
          permissions: [
            { resource: "task", actions: ["read", "accept", "submit", "resubmit", "comment", "attachment", "create", "update"] },
            { resource: "leave", actions: ["read", "apply", "cancel"] },
            { resource: "attendance", actions: ["read", "check_in", "check_out", "break_start", "break_end"] },
            { resource: "expense", actions: ["read", "create"] },
            { resource: "knowledge", actions: ["read"] }
          ]
        },
        {
          name: "AUDITOR",
          permissions: [
            { resource: "audit", actions: ["read"] },
            { resource: "payroll", actions: ["read"] },
            { resource: "attendance", actions: ["read"] },
            { resource: "task", actions: ["read"] },
            { resource: "leave", actions: ["read"] }
          ]
        },
        {
          name: "INTERN",
          permissions: [
            { resource: "task", actions: ["read", "accept", "submit", "resubmit", "comment"] },
            { resource: "knowledge", actions: ["read"] },
            { resource: "attendance", actions: ["read", "check_in", "check_out"] }
          ]
        }
      ];

      const rolesMap: Record<string, string> = {};
      for (const roleData of rolesData) {
        const role = await tx.role.create({
          data: {
            name: roleData.name,
            organizationId: org.id,
            isSystem: false,
            isTemplate: true
          }
        });
        rolesMap[roleData.name] = role.id;

        for (const perm of roleData.permissions) {
          for (const act of perm.actions) {
            await tx.rolePermission.create({
              data: {
                roleId: role.id,
                organizationId: org.id,
                resource: perm.resource,
                action: act
              }
            });
          }
        }
      }

      // 4. Seed Standard Leave Policies for the new Organization
      const leavePolicies = [
        { leaveType: LeaveType.SICK, daysAllowed: 10 },
        { leaveType: LeaveType.CASUAL, daysAllowed: 12 },
        { leaveType: LeaveType.EARNED, daysAllowed: 15 },
        { leaveType: LeaveType.WFH, daysAllowed: 30 }
      ];

      for (const policy of leavePolicies) {
        await tx.leavePolicy.create({
          data: {
            organizationId: org.id,
            leaveType: policy.leaveType,
            daysAllowed: policy.daysAllowed,
            carryForward: policy.leaveType === LeaveType.EARNED,
            maxCarryForward: policy.leaveType === LeaveType.EARNED ? 5 : 0
          }
        });
      }

      // 5. Seed a Default Shift Configuration
      const shift = await tx.shiftConfig.create({
        data: {
          organizationId: org.id,
          name: "General Shift",
          checkInStart: "09:00",
          checkInDeadline: "10:00",
          checkOutMin: "18:00",
          breakMaxMins: 60,
          workingHoursMin: 8.0,
          isDefault: true
        }
      });

      // 6. Create Departments
      const uniqueDepts: string[] = Array.from(
        new Set(
          employees
            .map((e: any) => e.departmentName?.trim())
            .filter((name: any): name is string => typeof name === "string" && name.length > 0)
        )
      );

      const deptsMap: Record<string, string> = {};
      for (const deptName of uniqueDepts) {
        const dept = await tx.department.create({
          data: {
            name: deptName,
            organizationId: org.id
          }
        });
        deptsMap[deptName.toLowerCase()] = dept.id;
      }

      // 7. Hash Password and Setup Employees
      const passwordHash = await hashPassword(defaultPassword);
      const emailToUserMap: Record<string, any> = {};
      const year = new Date().getFullYear();

      const baseCount = await tx.user.count({
        where: { employeeId: { startsWith: `EMP-${year}-` } },
        ignoreSoftDelete: true
      } as any);

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const email = emp.email.toLowerCase().trim();

        // Assign globally unique Employee ID
        let employeeId = "";
        let index = baseCount + i + 1;
        let foundUnique = false;
        while (!foundUnique) {
          employeeId = `EMP-${year}-${String(index).padStart(4, "0")}`;
          const existingUserWithId = await tx.user.findFirst({
            where: { employeeId, isDeleted: false }
          });
          if (!existingUserWithId) {
            foundUnique = true;
          } else {
            index++;
          }
        }

        // Determine Role
        let systemRole: SystemRole = SystemRole.EMPLOYEE;
        if (email === orgAdminEmail) {
          systemRole = SystemRole.ORG_ADMIN;
        } else if (hrEmails.includes(email)) {
          systemRole = SystemRole.HR;
        } else if (financeEmails.includes(email)) {
          systemRole = SystemRole.FINANCE;
        }

        const deptId = emp.departmentName ? deptsMap[emp.departmentName.trim().toLowerCase()] : null;

        let user;
        // If this email matches the current Org Admin, update their record instead of creating
        if (email === orgAdminEmail) {
          user = await tx.user.update({
            where: { id: adminUserId },
            data: {
              firstName: emp.firstName.trim(),
              lastName: emp.lastName.trim(),
              phone: emp.phone ? String(emp.phone).trim() : null,
              designation: emp.designation ? emp.designation.trim() : "CEO / Admin",
              departmentId: deptId,
              systemRole,
              salaryBand: emp.salaryBand || "BAND_A",
              basicSalary: emp.basicSalary ? parseFloat(emp.basicSalary) : null,
              ctcAnnual: emp.ctcAnnual ? parseFloat(emp.ctcAnnual) : null,
              taxRegime: emp.taxRegime || "NEW",
              shiftId: shift.id,
              employeeId
            }
          });
        } else {
          user = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName: emp.firstName.trim(),
              lastName: emp.lastName.trim(),
              phone: emp.phone ? String(emp.phone).trim() : null,
              designation: emp.designation ? emp.designation.trim() : null,
              organizationId: org.id,
              departmentId: deptId,
              systemRole,
              salaryBand: emp.salaryBand || null,
              basicSalary: emp.basicSalary ? parseFloat(emp.basicSalary) : null,
              ctcAnnual: emp.ctcAnnual ? parseFloat(emp.ctcAnnual) : null,
              taxRegime: emp.taxRegime || "NEW",
              shiftId: shift.id,
              status: UserStatus.ACTIVE,
              employeeId,
              forcePasswordChange: false
            }
          });
        }

        emailToUserMap[email] = user;

        // Initialize Leave Balances
        for (const policy of leavePolicies) {
          await tx.leaveBalance.create({
            data: {
              userId: user.id,
              leaveType: policy.leaveType,
              year,
              allocated: policy.daysAllowed,
              used: 0,
              pending: 0,
              remaining: policy.daysAllowed
            }
          });
        }

        // Link UserRoles
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: rolesMap.EMPLOYEE,
            scopeType: RoleScope.ORG,
            scopeId: org.id
          }
        });

        if (email === orgAdminEmail || hrEmails.includes(email)) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: rolesMap.HR_MANAGER,
              scopeType: RoleScope.ORG,
              scopeId: org.id
            }
          });
        }

        if (financeEmails.includes(email)) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: rolesMap.FINANCE_MANAGER,
              scopeType: RoleScope.ORG,
              scopeId: org.id
            }
          });
        }
      }

      // 8. Resolve Manager Mapping
      for (const emp of employees) {
        const email = emp.email.toLowerCase().trim();
        const managerEmail = emp.managerEmail?.toLowerCase().trim();

        if (managerEmail && managerEmail !== email) {
          const managerUser = emailToUserMap[managerEmail];
          const reportUser = emailToUserMap[email];

          if (managerUser && reportUser) {
            await tx.user.update({
              where: { id: reportUser.id },
              data: { managerId: managerUser.id }
            });

            const existingMgrRole = await tx.userRole.findFirst({
              where: { userId: managerUser.id, roleId: rolesMap.TEAM_MANAGER }
            });

            if (!existingMgrRole) {
              await tx.userRole.create({
                data: {
                  userId: managerUser.id,
                  roleId: rolesMap.TEAM_MANAGER,
                  scopeType: RoleScope.ORG,
                  scopeId: org.id
                }
              });
            }
          }
        }
      }

      return { org, orgAdmin: emailToUserMap[orgAdminEmail] };
    });

    return result;
  }
}
