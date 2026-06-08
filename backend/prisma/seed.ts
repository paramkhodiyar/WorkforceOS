import { PrismaClient, UserStatus, SystemRole, LeaveType, RoleScope, TaskStatus, TaskPriority, PayrollStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.knowledgeVersion.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.assetAssignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.expenseApproval.deleteMany();
  await prisma.expenseAttachment.deleteMany();
  await prisma.expenseClaim.deleteMany();
  await prisma.leaveApproval.deleteMany();
  await prisma.leaveAttachment.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskReview.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.task.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "Dunder Mifflin Paper Company",
      slug: "dunder-mifflin",
      isActive: true,
      enabledFeatures: ["employees", "attendance", "leave", "tasks", "performance", "payroll", "expenses", "assets", "knowledge"]
    }
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@workforceos.com",
      passwordHash,
      firstName: "David",
      lastName: "Wallace",
      systemRole: SystemRole.SUPER_ADMIN,
      organizationId: org.id,
      status: UserStatus.ACTIVE
    }
  });

  const michael = await prisma.user.create({
    data: {
      email: "michael@dunder-mifflin.com",
      passwordHash,
      firstName: "Michael",
      lastName: "Scott",
      systemRole: SystemRole.ORG_ADMIN,
      organizationId: org.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-1000",
      designation: "Regional Manager",
      salaryBand: "BAND_A",
      joinDate: new Date("2010-01-01")
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
      name: "Sales & Admin",
      organizationId: org.id
    }
  });

  const team = await prisma.team.create({
    data: {
      name: "Scranton Branch",
      departmentId: dept.id
    }
  });

  const toby = await prisma.user.create({
    data: {
      email: "toby@dunder-mifflin.com",
      passwordHash,
      firstName: "Toby",
      lastName: "Flenderson",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: dept.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0010",
      designation: "HR Representative",
      salaryBand: "BAND_B",
      joinDate: new Date("2015-06-01")
    }
  });

  await prisma.userRole.create({
    data: {
      userId: toby.id,
      roleId: rolesMap.HR_MANAGER,
      scopeType: RoleScope.ORG,
      scopeId: org.id
    }
  });

  const jim = await prisma.user.create({
    data: {
      email: "jim@dunder-mifflin.com",
      passwordHash,
      firstName: "Jim",
      lastName: "Halpert",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: dept.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0002",
      designation: "Assistant Regional Manager",
      salaryBand: "BAND_A",
      joinDate: new Date("2018-02-15")
    }
  });

  await prisma.userRole.create({
    data: {
      userId: jim.id,
      roleId: rolesMap.TEAM_MANAGER,
      scopeType: RoleScope.TEAM,
      scopeId: team.id
    }
  });

  await prisma.team.update({
    where: { id: team.id },
    data: { leadId: jim.id }
  });

  const dwight = await prisma.user.create({
    data: {
      email: "dwight@dunder-mifflin.com",
      passwordHash,
      firstName: "Dwight",
      lastName: "Schrute",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: dept.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0003",
      designation: "Assistant to the Regional Manager",
      salaryBand: "BAND_A",
      joinDate: new Date("2016-03-12")
    }
  });

  await prisma.userRole.create({
    data: {
      userId: dwight.id,
      roleId: rolesMap.DEPARTMENT_HEAD,
      scopeType: RoleScope.DEPARTMENT,
      scopeId: dept.id
    }
  });

  await prisma.department.update({
    where: { id: dept.id },
    data: { headId: dwight.id }
  });

  const officeEmployees = [
    { email: "pam@dunder-mifflin.com", firstName: "Pam", lastName: "Beesly", employeeId: "EMP-2026-0004", salaryBand: "BAND_B", designation: "Office Administrator", joinDate: new Date("2018-09-01") },
    { email: "stanley@dunder-mifflin.com", firstName: "Stanley", lastName: "Hudson", employeeId: "EMP-2026-0005", salaryBand: "BAND_A", designation: "Sales Representative", joinDate: new Date("2012-04-10") },
    { email: "angela@dunder-mifflin.com", firstName: "Angela", lastName: "Martin", employeeId: "EMP-2026-0006", salaryBand: "BAND_A", designation: "Head of Accounting", joinDate: new Date("2014-05-15") },
    { email: "kevin@dunder-mifflin.com", firstName: "Kevin", lastName: "Malone", employeeId: "EMP-2026-0007", salaryBand: "BAND_C", designation: "Accountant", joinDate: new Date("2019-10-01") },
    { email: "creed@dunder-mifflin.com", firstName: "Creed", lastName: "Bratton", employeeId: "EMP-2026-0008", salaryBand: "BAND_C", designation: "Quality Assurance", joinDate: new Date("2011-11-11") }
  ];

  const employeesList: any[] = [];
  for (const empData of officeEmployees) {
    const emp = await prisma.user.create({
      data: {
        email: empData.email,
        passwordHash,
        firstName: empData.firstName,
        lastName: empData.lastName,
        employeeId: empData.employeeId,
        systemRole: SystemRole.EMPLOYEE,
        organizationId: org.id,
        departmentId: dept.id,
        managerId: jim.id,
        status: UserStatus.ACTIVE,
        salaryBand: empData.salaryBand,
        designation: empData.designation,
        joinDate: empData.joinDate
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

  const ryan = await prisma.user.create({
    data: {
      email: "ryan@dunder-mifflin.com",
      passwordHash,
      firstName: "Ryan",
      lastName: "Howard",
      employeeId: "EMP-2026-9999",
      systemRole: SystemRole.INTERN,
      organizationId: org.id,
      departmentId: dept.id,
      managerId: jim.id,
      status: UserStatus.ACTIVE,
      salaryBand: "20000",
      designation: "Temp Intern",
      joinDate: new Date("2026-05-01")
    }
  });

  await prisma.userRole.create({
    data: {
      userId: ryan.id,
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

  const allUsers = [michael, toby, jim, dwight, ryan, ...employeesList];
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

  const taskData = [
    { title: "Organize the 8th Annual Dundie Awards", description: "Book Chilli's party room, prepare Dundie trophies and plan Michael's opening set.", assigneeId: employeesList[0].id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS },
    { title: "Audit Dwight's Beet Farm Travel claims", description: "Dwight claimed beet manure transport cost under business travel. Needs compliance audit.", assigneeId: employeesList[2].id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO },
    { title: "Reconcile Scranton quarterly ledger", description: "Audit ledger sheet and make sure Keleven is not used as a number.", assigneeId: employeesList[3].id, priority: TaskPriority.HIGH, status: TaskStatus.TODO },
    { title: "Perform watermark Quality Assurance on incoming shipments", description: "Ensure that watermarks do not contain offensive material.", assigneeId: employeesList[4].id, priority: TaskPriority.HIGH, status: TaskStatus.DONE },
    { title: "Clean Michael's coffee maker", description: "Must scrub the inside of the coffee maker carefully.", assigneeId: ryan.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED },
    { title: "Re-negotiate paper contract with Lackawanna County", description: "Prepare sales materials and client contract sheets.", assigneeId: jim.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS },
    { title: "Water Dwight's desk beets", description: "Give beets exactly 200ml of water every morning.", assigneeId: ryan.id, priority: TaskPriority.LOW, status: TaskStatus.TODO },
    { title: "Draft new corporate leave handbook", description: "Draft the leave guidelines and policies for the Scranton branch.", assigneeId: toby.id, priority: TaskPriority.MEDIUM, status: TaskStatus.DONE }
  ];

  for (let i = 0; i < taskData.length; i++) {
    const t = taskData[i];
    await prisma.task.create({
      data: {
        taskId: `TASK-${String(i + 1).padStart(4, "0")}`,
        title: t.title,
        description: t.description,
        creatorId: michael.id,
        assigneeId: t.assigneeId,
        priority: t.priority,
        status: t.status,
        dueDate: new Date("2026-06-30")
      }
    });
  }

  await prisma.leaveRequest.create({
    data: {
      userId: dwight.id,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-06-15"),
      endDate: new Date("2026-06-18"),
      reason: "Emergency beet harvesting at Schrute Farms.",
      status: "PENDING",
      days: 4
    }
  });

  await prisma.leaveRequest.create({
    data: {
      userId: jim.id,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-06-20"),
      endDate: new Date("2026-06-20"),
      reason: "Prank preparation and planning day.",
      status: "PENDING",
      days: 1
    }
  });

  const salaryBandsMap: Record<string, number> = {
    "BAND_A": 85000,
    "BAND_B": 55000,
    "BAND_C": 40000,
    "20000": 20000
  };

  for (let month = 1; month <= 5; month++) {
    const run = await prisma.payrollRun.create({
      data: {
        organizationId: org.id,
        month,
        year: 2026,
        status: PayrollStatus.PAID,
        generatedBy: superAdmin.id,
        approvedBy: superAdmin.id,
        paidBy: superAdmin.id,
        generatedAt: new Date(2026, month - 1, 28),
        approvedAt: new Date(2026, month - 1, 28),
        paidAt: new Date(2026, month - 1, 28)
      }
    });

    for (const user of allUsers) {
      if (user.systemRole === SystemRole.SUPER_ADMIN) continue;

      const baseSalary = salaryBandsMap[user.salaryBand || "BAND_C"] || 40000;
      const hra = baseSalary * 0.4;
      const allowances = baseSalary * 0.1;
      const bonus = (month === 5 && (user.firstName === "Dwight" || user.firstName === "Jim")) ? 12000 : 0;
      const grossSalary = baseSalary + hra + allowances + bonus;
      const pf = baseSalary * 0.12;
      const tax = grossSalary * 0.1;
      const totalDeductions = pf + tax;
      const netSalary = grossSalary - totalDeductions;

      await prisma.payrollRecord.create({
        data: {
          payrollRunId: run.id,
          userId: user.id,
          basicSalary: baseSalary,
          hra,
          allowances,
          bonus,
          grossSalary,
          pf,
          tax,
          totalDeductions,
          netSalary
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
