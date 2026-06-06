import { PrismaClient, UserStatus, SystemRole, LeaveType, RoleScope } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "process";

const prisma = new PrismaClient();

async function main() {
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: "acme" }
  });

  if (existingOrg) {
    return;
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const org = await prisma.organization.create({
    data: {
      name: "Acme Corporation",
      slug: "acme",
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      email: "superadmin@workforceos.com",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      systemRole: SystemRole.SUPER_ADMIN,
      organizationId: org.id,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.user.create({
    data: {
      email: "orgadmin@acme.com",
      passwordHash,
      firstName: "Alice",
      lastName: "Smith",
      systemRole: SystemRole.ORG_ADMIN,
      organizationId: org.id,
      status: UserStatus.ACTIVE
    }
  });

  const rolesData = [
    { name: "HR_MANAGER", resources: ["employee", "leave"], actions: ["create", "read", "update", "delete", "approve", "hr_approve", "manage_policy"] },
    { name: "FINANCE_MANAGER", resources: ["payroll", "expense"], actions: ["read", "generate", "approve", "mark_paid", "finance_approve"] },
    { name: "DEPARTMENT_HEAD", resources: ["employee", "leave", "performance"], actions: ["read", "approve", "review", "leaderboard"] },
    { name: "TEAM_MANAGER", resources: ["task", "leave", "attendance"], actions: ["create", "read", "update", "delete", "assign", "close", "review", "approve", "read_team"] },
    { name: "EMPLOYEE", resources: ["task", "leave", "attendance", "expense", "knowledge"], actions: ["read", "accept", "submit", "resubmit", "comment", "attachment", "apply", "cancel", "check_in", "check_out", "break_start", "break_end", "create", "update"] },
    { name: "AUDITOR", resources: ["audit", "payroll", "attendance", "task", "leave"], actions: ["read"] },
    { name: "INTERN", resources: ["task", "knowledge", "attendance"], actions: ["read", "accept", "submit", "resubmit", "comment", "check_in", "check_out"] }
  ];

  const rolesMap: Record<string, string> = {};

  for (const roleData of rolesData) {
    const role = await prisma.role.create({
      data: {
        name: roleData.name,
        organizationId: org.id,
        isSystem: false,
        isTemplate: true
      }
    });
    rolesMap[roleData.name] = role.id;

    for (const res of roleData.resources) {
      for (const act of roleData.actions) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            organizationId: org.id,
            resource: res,
            action: act
          }
        });
      }
    }
  }

  const dept = await prisma.department.create({
    data: {
      name: "Engineering",
      organizationId: org.id
    }
  });

  const team = await prisma.team.create({
    data: {
      name: "Core Infrastructure",
      departmentId: dept.id
    }
  });

  const hrUser = await prisma.user.create({
    data: {
      email: "hr@acme.com",
      passwordHash,
      firstName: "Bob",
      lastName: "Jones",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: dept.id,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.userRole.create({
    data: {
      userId: hrUser.id,
      roleId: rolesMap.HR_MANAGER,
      scopeType: RoleScope.ORG,
      scopeId: org.id
    }
  });

  const manager1 = await prisma.user.create({
    data: {
      email: "manager1@acme.com",
      passwordHash,
      firstName: "Charlie",
      lastName: "Brown",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: dept.id,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.userRole.create({
    data: {
      userId: manager1.id,
      roleId: rolesMap.TEAM_MANAGER,
      scopeType: RoleScope.TEAM,
      scopeId: team.id
    }
  });

  await prisma.team.update({
    where: { id: team.id },
    data: { leadId: manager1.id }
  });

  const manager2 = await prisma.user.create({
    data: {
      email: "manager2@acme.com",
      passwordHash,
      firstName: "Diana",
      lastName: "Prince",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: dept.id,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.userRole.create({
    data: {
      userId: manager2.id,
      roleId: rolesMap.DEPARTMENT_HEAD,
      scopeType: RoleScope.DEPARTMENT,
      scopeId: dept.id
    }
  });

  await prisma.department.update({
    where: { id: dept.id },
    data: { headId: manager2.id }
  });

  const employeesList = [];
  for (let i = 1; i <= 5; i++) {
    const emp = await prisma.user.create({
      data: {
        email: `emp${i}@acme.com`,
        passwordHash,
        firstName: "Employee",
        lastName: `${i}`,
        employeeId: `EMP-2026-000${i}`,
        systemRole: SystemRole.EMPLOYEE,
        organizationId: org.id,
        departmentId: dept.id,
        managerId: manager1.id,
        status: UserStatus.ACTIVE,
        salaryBand: "BAND_A",
        joinDate: new Date("2026-01-01")
      }
    });
    employeesList.push(emp);

    await prisma.userRole.create({
      data: {
        userId: emp.id,
        roleId: rolesMap.EMPLOYEE,
        scopeType: RoleScope.ORG,
        scopeId: org.id
      }
    });
  }

  const internUser = await prisma.user.create({
    data: {
      email: "intern@acme.com",
      passwordHash,
      firstName: "Ian",
      lastName: "Intern",
      employeeId: "EMP-2026-9999",
      systemRole: SystemRole.INTERN,
      organizationId: org.id,
      departmentId: dept.id,
      managerId: manager1.id,
      status: UserStatus.ACTIVE,
      salaryBand: "20000",
      joinDate: new Date("2026-05-01")
    }
  });

  await prisma.userRole.create({
    data: {
      userId: internUser.id,
      roleId: rolesMap.INTERN,
      scopeType: RoleScope.ORG,
      scopeId: org.id
    }
  });

  const leavePolicies = [
    { leaveType: LeaveType.SICK, daysAllowed: 12 },
    { leaveType: LeaveType.CASUAL, daysAllowed: 12 },
    { leaveType: LeaveType.EARNED, daysAllowed: 15 },
    { leaveType: LeaveType.WFH, daysAllowed: 30 },
    { leaveType: LeaveType.HALF_DAY, daysAllowed: 10 }
  ];

  for (const policy of leavePolicies) {
    await prisma.leavePolicy.create({
      data: {
        organizationId: org.id,
        leaveType: policy.leaveType,
        daysAllowed: policy.daysAllowed
      }
    });
  }

  const allUsers = [hrUser, manager1, manager2, internUser, ...employeesList];
  for (const u of allUsers) {
    for (const policy of leavePolicies) {
      await prisma.leaveBalance.create({
        data: {
          userId: u.id,
          leaveType: policy.leaveType,
          year: 2026,
          allocated: policy.daysAllowed,
          used: 0,
          pending: 0,
          remaining: policy.daysAllowed
        }
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
