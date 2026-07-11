import { PrismaClient, UserStatus, SystemRole, LeaveType, RoleScope, TaskStatus, TaskPriority, PayrollStatus, LeaveStatus, AttendanceStatus, WorkMode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Cleaning up existing database tables...");
  await prisma.recurrenceException.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.knowledgeVersion.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.assetAssignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.bankDetail.deleteMany();
  await prisma.emergencyContact.deleteMany();
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
  await prisma.taskStatusHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.attendanceAdjustmentRequest.deleteMany();
  await prisma.attendanceBreak.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Seeding organization...");
  const org = await prisma.organization.create({
    data: {
      name: "WorkforceOS Demo Corp",
      slug: "dunder-mifflin",
      isActive: true,
      enabledFeatures: ["employees", "attendance", "leave", "tasks", "performance", "payroll", "expenses", "assets", "knowledge", "calendar"]
    }
  });

  console.log("Seeding superadmin...");
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

  console.log("Seeding role templates...");
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
    const role = await prisma.role.create({
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
        await prisma.rolePermission.create({
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

  console.log("Seeding departments...");
  const depts = {
    Management: await prisma.department.create({ data: { name: "Management", organizationId: org.id } }),
    HR: await prisma.department.create({ data: { name: "HR", organizationId: org.id } }),
    Finance: await prisma.department.create({ data: { name: "Finance", organizationId: org.id } }),
    Sales: await prisma.department.create({ data: { name: "Sales", organizationId: org.id } }),
    Engineering: await prisma.department.create({ data: { name: "Engineering", organizationId: org.id } }),
    Operations: await prisma.department.create({ data: { name: "Operations", organizationId: org.id } })
  };

  console.log("Seeding 10 users...");
  // Create admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@workforceos.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      systemRole: SystemRole.ORG_ADMIN,
      organizationId: org.id,
      departmentId: depts.Management.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0001",
      designation: "General Manager",
      salaryBand: "BAND_A",
      joinDate: new Date("2020-01-01")
    }
  });
  await prisma.userRole.create({
    data: { userId: adminUser.id, roleId: rolesMap.EMPLOYEE, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create HR
  const hrUser = await prisma.user.create({
    data: {
      email: "hr@workforceos.com",
      passwordHash,
      firstName: "HR",
      lastName: "Manager",
      systemRole: SystemRole.HR,
      organizationId: org.id,
      departmentId: depts.HR.id,
      managerId: adminUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0002",
      designation: "HR Director",
      salaryBand: "BAND_B",
      joinDate: new Date("2021-06-15")
    }
  });
  await prisma.userRole.create({
    data: { userId: hrUser.id, roleId: rolesMap.HR_MANAGER, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create Finance
  const financeUser = await prisma.user.create({
    data: {
      email: "finance@workforceos.com",
      passwordHash,
      firstName: "Finance",
      lastName: "Manager",
      systemRole: SystemRole.FINANCE,
      organizationId: org.id,
      departmentId: depts.Finance.id,
      managerId: adminUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0003",
      designation: "Finance Controller",
      salaryBand: "BAND_A",
      joinDate: new Date("2021-03-10")
    }
  });
  await prisma.userRole.create({
    data: { userId: financeUser.id, roleId: rolesMap.FINANCE_MANAGER, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create Manager (Sales Lead)
  const managerUser = await prisma.user.create({
    data: {
      email: "manager@workforceos.com",
      passwordHash,
      firstName: "Team",
      lastName: "Lead",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: depts.Sales.id,
      managerId: adminUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0004",
      designation: "Sales Manager",
      salaryBand: "BAND_B",
      joinDate: new Date("2022-02-01")
    }
  });
  await prisma.userRole.create({
    data: { userId: managerUser.id, roleId: rolesMap.TEAM_MANAGER, scopeType: RoleScope.DEPARTMENT, scopeId: depts.Sales.id }
  });

  // Create Employee 1
  const employee1 = await prisma.user.create({
    data: {
      email: "employee1@workforceos.com",
      passwordHash,
      firstName: "Sales",
      lastName: "Specialist",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: depts.Sales.id,
      managerId: managerUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0005",
      designation: "Sales Specialist",
      salaryBand: "BAND_C",
      joinDate: new Date("2023-04-10")
    }
  });
  await prisma.userRole.create({
    data: { userId: employee1.id, roleId: rolesMap.EMPLOYEE, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create Employee 2
  const employee2 = await prisma.user.create({
    data: {
      email: "employee2@workforceos.com",
      passwordHash,
      firstName: "Senior",
      lastName: "Developer",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: depts.Engineering.id,
      managerId: adminUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0006",
      designation: "Senior Engineer",
      salaryBand: "BAND_A",
      joinDate: new Date("2022-08-01")
    }
  });
  await prisma.userRole.create({
    data: { userId: employee2.id, roleId: rolesMap.EMPLOYEE, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create Employee 3
  const employee3 = await prisma.user.create({
    data: {
      email: "employee3@workforceos.com",
      passwordHash,
      firstName: "QA",
      lastName: "Lead",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: depts.Engineering.id,
      managerId: employee2.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0007",
      designation: "Quality Assurance Lead",
      salaryBand: "BAND_C",
      joinDate: new Date("2023-01-15")
    }
  });
  await prisma.userRole.create({
    data: { userId: employee3.id, roleId: rolesMap.EMPLOYEE, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create Employee 4
  const employee4 = await prisma.user.create({
    data: {
      email: "employee4@workforceos.com",
      passwordHash,
      firstName: "Operations",
      lastName: "Associate",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: depts.Operations.id,
      managerId: adminUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0008",
      designation: "Operations Associate",
      salaryBand: "BAND_C",
      joinDate: new Date("2024-05-20")
    }
  });
  await prisma.userRole.create({
    data: { userId: employee4.id, roleId: rolesMap.EMPLOYEE, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create Employee 5
  const employee5 = await prisma.user.create({
    data: {
      email: "employee5@workforceos.com",
      passwordHash,
      firstName: "Account",
      lastName: "Executive",
      systemRole: SystemRole.EMPLOYEE,
      organizationId: org.id,
      departmentId: depts.Finance.id,
      managerId: financeUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0009",
      designation: "Accounts Executive",
      salaryBand: "BAND_C",
      joinDate: new Date("2023-11-01")
    }
  });
  await prisma.userRole.create({
    data: { userId: employee5.id, roleId: rolesMap.EMPLOYEE, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  // Create Intern
  const internUser = await prisma.user.create({
    data: {
      email: "intern@workforceos.com",
      passwordHash,
      firstName: "Intern",
      lastName: "Trainee",
      systemRole: SystemRole.INTERN,
      organizationId: org.id,
      departmentId: depts.HR.id,
      managerId: hrUser.id,
      status: UserStatus.ACTIVE,
      employeeId: "EMP-2026-0010",
      designation: "HR Trainee",
      salaryBand: "BAND_E",
      joinDate: new Date("2026-05-01")
    }
  });
  await prisma.userRole.create({
    data: { userId: internUser.id, roleId: rolesMap.INTERN, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  const allOrgUsers = [adminUser, hrUser, financeUser, managerUser, employee1, employee2, employee3, employee4, employee5, internUser];

  console.log("Seeding emergency contacts & bank details...");
  for (let i = 0; i < allOrgUsers.length; i++) {
    const u = allOrgUsers[i];
    await prisma.emergencyContact.create({
      data: {
        userId: u.id,
        name: `Emergency Contact ${i+1}`,
        relation: "Family Member",
        phone: `+91 98765 4321${i}`
      }
    });

    await prisma.bankDetail.create({
      data: {
        userId: u.id,
        accountNumber: `456710200030${i}`,
        ifscCode: "SBIN0003014",
        panNumber: `ABCDE123${i}F`,
        bankName: "State Bank of India",
        accountHolderName: `${u.firstName} ${u.lastName}`
      }
    });
  }

  console.log("Seeding leave policies & balances...");
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

  for (const u of allOrgUsers) {
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

  console.log("Seeding shift config...");
  await prisma.shiftConfig.create({
    data: {
      organizationId: org.id,
      name: "General Office Shift",
      checkInStart: "08:00",
      checkInDeadline: "10:30",
      checkOutMin: "16:00",
      breakMaxMins: 60,
      workingHoursMin: 8.0,
      isDefault: true
    }
  });

  console.log("Seeding 5 days of attendance logs...");
  const last5Days: Date[] = [];
  let currDate = new Date();
  while (last5Days.length < 5) {
    currDate.setDate(currDate.getDate() - 1);
    const day = currDate.getDay();
    if (day !== 0 && day !== 6) { // Skip weekends
      last5Days.push(new Date(currDate));
    }
  }

  for (const u of allOrgUsers) {
    for (const d of last5Days) {
      // 9:00 AM +/- 15 mins
      const randMinIn = Math.floor(Math.random() * 30) - 15;
      const checkIn = new Date(d);
      checkIn.setHours(9, randMinIn, 0, 0);

      // 6:00 PM +/- 20 mins
      const randMinOut = Math.floor(Math.random() * 40) - 20;
      const checkOut = new Date(d);
      checkOut.setHours(18, randMinOut, 0, 0);

      const totalHours = Number(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));

      await prisma.attendance.create({
        data: {
          userId: u.id,
          date: d,
          checkIn,
          checkOut,
          totalHours,
          status: AttendanceStatus.PRESENT,
          workMode: Math.random() > 0.8 ? WorkMode.WFH : WorkMode.WFO
        }
      });
    }
  }

  console.log("Seeding leave requests & approval logs...");
  // Pending Leave
  await prisma.leaveRequest.create({
    data: {
      userId: employee1.id,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-07-20"),
      endDate: new Date("2026-07-22"),
      days: 3,
      reason: "Visiting parents for family occasion",
      status: LeaveStatus.PENDING
    }
  });

  // Approved Leave
  const approvedLeave = await prisma.leaveRequest.create({
    data: {
      userId: employee2.id,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-07-02"),
      endDate: new Date("2026-07-03"),
      days: 2,
      reason: "Family summer vacation trip",
      status: LeaveStatus.APPROVED
    }
  });
  await prisma.leaveApproval.create({
    data: {
      leaveRequestId: approvedLeave.id,
      approverId: hrUser.id,
      action: "APPROVED",
      comment: "Approved. Have a safe and happy vacation!"
    }
  });

  // Rejected Leave
  const rejectedLeave = await prisma.leaveRequest.create({
    data: {
      userId: employee5.id,
      leaveType: LeaveType.SICK,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-01"),
      days: 1,
      reason: "Need a personal day",
      status: LeaveStatus.REJECTED
    }
  });
  await prisma.leaveApproval.create({
    data: {
      leaveRequestId: rejectedLeave.id,
      approverId: financeUser.id,
      action: "REJECTED",
      comment: "Rejected due to month-end payroll reconciliation cycles."
    }
  });

  console.log("Seeding role-wise tasks...");
  const tasksList = [
    { title: "Conduct Intern exit evaluation", desc: "Evaluate performance and finalize internship files.", assigneeId: hrUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS },
    { title: "Audit Employee Handbook updates", desc: "Update sections on remote/hybrid work compliance.", assigneeId: hrUser.id, priority: TaskPriority.HIGH, status: TaskStatus.ASSIGNED },
    { title: "Q2 expense receipt compliance audit", desc: "Verify ledger against scanned claims sheets.", assigneeId: financeUser.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS },
    { title: "Optimize tax slab calculations", desc: "Update finance system config values for current year tax.", assigneeId: financeUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.ASSIGNED },
    { title: "Renew Lackawanna county paper contract", desc: "Discuss contract renewals and prepare presentations.", assigneeId: employee1.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS },
    { title: "Review team sales pipelines for Q3", desc: "Review sales targets for Scranton sales reps.", assigneeId: managerUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.ASSIGNED },
    { title: "Optimize database index for AuditLog table", desc: "Run analysis and create compound index on audit queries.", assigneeId: employee2.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS },
    { title: "Draft QA unit testing checklist", desc: "Draft a testing template for new features.", assigneeId: employee3.id, priority: TaskPriority.MEDIUM, status: TaskStatus.ASSIGNED },
    { title: "Audit Scranton office paper supply", desc: "Count paper boxes and place re-orders if below 20.", assigneeId: employee4.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED },
    { title: "Filing and scanning intern reports", desc: "Scan exit surveys and file in cabinets.", assigneeId: internUser.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED }
  ];

  for (let i = 0; i < tasksList.length; i++) {
    const t = tasksList[i];
    await prisma.task.create({
      data: {
        taskId: `TASK-${String(i + 1).padStart(4, "0")}`,
        title: t.title,
        description: t.desc,
        creatorId: adminUser.id,
        assigneeId: t.assigneeId,
        priority: t.priority,
        status: t.status,
        dueDate: new Date("2026-07-28")
      }
    });
  }

  console.log("Seeding payroll history (Jan-June 2026)...");
  const salaryBandsMap: Record<string, number> = {
    "BAND_A": 85000,
    "BAND_B": 60000,
    "BAND_C": 45000,
    "BAND_E": 20000
  };

  for (let month = 1; month <= 6; month++) {
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

    for (const u of allOrgUsers) {
      const baseSalary = salaryBandsMap[u.salaryBand || "BAND_C"] || 45000;
      const hra = baseSalary * 0.4;
      const allowances = baseSalary * 0.1;
      const bonus = (month === 6 && u.firstName === "Sales") ? 15000 : 0;
      const grossSalary = baseSalary + hra + allowances + bonus;
      const pf = baseSalary * 0.12;
      const tax = grossSalary * 0.1;
      const totalDeductions = pf + tax;
      const netSalary = grossSalary - totalDeductions;

      await prisma.payrollRecord.create({
        data: {
          payrollRunId: run.id,
          userId: u.id,
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

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
