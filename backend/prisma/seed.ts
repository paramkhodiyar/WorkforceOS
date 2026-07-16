import { PrismaClient, UserStatus, SystemRole, LeaveType, RoleScope, TaskStatus, TaskPriority, TaskScope, PayrollStatus, LeaveStatus, AttendanceStatus, WorkMode, EmployeeType, TaxRegime } from "@prisma/client";
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
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shiftConfig.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Seeding organization...");
  const org = await prisma.organization.create({
    data: {
      name: "Dunder Mifflin Paper",
      slug: "dunder-mifflin",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Dunder_Mifflin%2C_Inc.svg/320px-Dunder_Mifflin%2C_Inc.svg.png",
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

  console.log("Seeding system owner...");
  await prisma.user.create({
    data: {
      email: "paramkhodiyar1008@gmail.com",
      passwordHash: await bcrypt.hash("Param@1008", 10),
      firstName: "Param",
      lastName: "Owner",
      systemRole: SystemRole.SYS_OWNER,
      organizationId: org.id,
      status: UserStatus.ACTIVE,
      employeeId: "OWNER-001",
      forcePasswordChange: false
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
      joinDate: new Date("2020-01-01"),
      phone: "+91 90000 00001",
      personalEmail: "admin.personal@workforceos.com",
      personalPhone: "+91 91000 00001",
      dateOfBirth: new Date("1985-04-12"),
      gender: "Male",
      bloodGroup: "A+",
      address: {
        line1: "101 Slough Ave",
        line2: "Penthouse Suite",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 150000,
      ctcAnnual: 2160000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2021-06-15"),
      phone: "+91 90000 00002",
      personalEmail: "hr.personal@workforceos.com",
      personalPhone: "+91 91000 00002",
      dateOfBirth: new Date("1990-08-24"),
      gender: "Female",
      bloodGroup: "B+",
      address: {
        line1: "204 Slough Ave",
        line2: "Apt 20",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 100000,
      ctcAnnual: 1440000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2021-03-10"),
      phone: "+91 90000 00003",
      personalEmail: "finance.personal@workforceos.com",
      personalPhone: "+91 91000 00003",
      dateOfBirth: new Date("1988-11-15"),
      gender: "Male",
      bloodGroup: "O+",
      address: {
        line1: "309 Slough Ave",
        line2: "Suite A",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 100000,
      ctcAnnual: 1440000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2022-02-01"),
      phone: "+91 90000 00004",
      personalEmail: "manager.personal@workforceos.com",
      personalPhone: "+91 91000 00004",
      dateOfBirth: new Date("1986-07-02"),
      gender: "Male",
      bloodGroup: "AB+",
      address: {
        line1: "412 Slough Ave",
        line2: "Floor 2",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 80000,
      ctcAnnual: 1152000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2023-04-10"),
      phone: "+91 90000 00005",
      personalEmail: "sales.personal@workforceos.com",
      personalPhone: "+91 91000 00005",
      dateOfBirth: new Date("1993-12-05"),
      gender: "Female",
      bloodGroup: "A-",
      address: {
        line1: "505 Slough Ave",
        line2: "Apt 5",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 50050,
      ctcAnnual: 720000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2022-08-01"),
      phone: "+91 90000 00006",
      personalEmail: "eng.personal@workforceos.com",
      personalPhone: "+91 91000 00006",
      dateOfBirth: new Date("1991-03-30"),
      gender: "Male",
      bloodGroup: "O-",
      address: {
        line1: "606 Slough Ave",
        line2: "Apt 2B",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 110000,
      ctcAnnual: 1584000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2023-01-15"),
      phone: "+91 90000 00007",
      personalEmail: "qa.personal@workforceos.com",
      personalPhone: "+91 91000 00007",
      dateOfBirth: new Date("1994-09-18"),
      gender: "Female",
      bloodGroup: "B-",
      address: {
        line1: "707 Slough Ave",
        line2: "Suite 7",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 60000,
      ctcAnnual: 864000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2024-05-20"),
      phone: "+91 90000 00008",
      personalEmail: "ops.personal@workforceos.com",
      personalPhone: "+91 91000 00008",
      dateOfBirth: new Date("1995-10-22"),
      gender: "Male",
      bloodGroup: "AB-",
      address: {
        line1: "808 Slough Ave",
        line2: "Warehouse B",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 55000,
      ctcAnnual: 792000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2023-11-01"),
      phone: "+91 90000 00009",
      personalEmail: "acc.personal@workforceos.com",
      personalPhone: "+91 91000 00009",
      dateOfBirth: new Date("1992-06-11"),
      gender: "Female",
      bloodGroup: "O+",
      address: {
        line1: "909 Slough Ave",
        line2: "Apt 9",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.FULL_TIME,
      workLocation: "Scranton Headquarters",
      basicSalary: 65000,
      ctcAnnual: 936000,
      pfApplicable: true,
      taxRegime: TaxRegime.NEW
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
      joinDate: new Date("2026-05-01"),
      phone: "+91 90000 00010",
      personalEmail: "intern.personal@workforceos.com",
      personalPhone: "+91 91000 00010",
      dateOfBirth: new Date("2003-02-14"),
      gender: "Male",
      bloodGroup: "A+",
      address: {
        line1: "1010 Slough Ave",
        line2: "Dorm 40",
        city: "Scranton",
        state: "Pennsylvania",
        zip: "18503",
        country: "USA"
      },
      employeeType: EmployeeType.INTERN,
      workLocation: "Scranton Headquarters",
      basicSalary: 25000,
      ctcAnnual: 300000,
      pfApplicable: false,
      taxRegime: TaxRegime.NEW,
      probationEndDate: new Date("2026-11-01")
    }
  });
  await prisma.userRole.create({
    data: { userId: internUser.id, roleId: rolesMap.INTERN, scopeType: RoleScope.ORG, scopeId: org.id }
  });

  const allOrgUsers = [adminUser, hrUser, financeUser, managerUser, employee1, employee2, employee3, employee4, employee5, internUser];

  console.log("Assigning department heads...");
  await prisma.department.update({
    where: { id: depts.Management.id },
    data: { headId: adminUser.id }
  });
  await prisma.department.update({
    where: { id: depts.HR.id },
    data: { headId: hrUser.id }
  });
  await prisma.department.update({
    where: { id: depts.Finance.id },
    data: { headId: financeUser.id }
  });
  await prisma.department.update({
    where: { id: depts.Sales.id },
    data: { headId: managerUser.id }
  });
  await prisma.department.update({
    where: { id: depts.Engineering.id },
    data: { headId: employee2.id }
  });
  await prisma.department.update({
    where: { id: depts.Operations.id },
    data: { headId: employee4.id }
  });

  console.log("Seeding teams & assigning leads/members...");
  await prisma.team.create({
    data: {
      name: "Scranton Sales Reps",
      departmentId: depts.Sales.id,
      leadId: managerUser.id,
      members: {
        connect: [
          { id: managerUser.id },
          { id: employee1.id }
        ]
      }
    }
  });

  const coreDevTeam = await prisma.team.create({
    data: {
      name: "Core Development",
      departmentId: depts.Engineering.id,
      leadId: employee2.id,
      members: {
        connect: [
          { id: employee2.id },
          { id: employee3.id }
        ]
      }
    }
  });

  await prisma.team.create({
    data: {
      name: "Talent Acquisition",
      departmentId: depts.HR.id,
      leadId: hrUser.id,
      members: {
        connect: [
          { id: hrUser.id },
          { id: internUser.id }
        ]
      }
    }
  });

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
      let used = 0;
      let pending = 0;

      // Generate realistic used and pending leave counts
      if (policy.leaveType === LeaveType.SICK) {
        used = Math.floor(Math.random() * 4) + 1; // 1 to 4 days used
      } else if (policy.leaveType === LeaveType.CASUAL) {
        used = Math.floor(Math.random() * 5) + 2; // 2 to 6 days used
        if (Math.random() > 0.6) pending = 1;
      } else if (policy.leaveType === LeaveType.EARNED) {
        used = Math.floor(Math.random() * 6) + 3; // 3 to 8 days used
      } else if (policy.leaveType === LeaveType.WFH) {
        used = Math.floor(Math.random() * 11) + 5; // 5 to 15 days used
        if (Math.random() > 0.5) pending = Math.floor(Math.random() * 3) + 1;
      } else if (policy.leaveType === LeaveType.HALF_DAY) {
        used = Math.floor(Math.random() * 3) + 1; // 1 to 3 days used
      }

      // Synchronize with seeded requests
      if (u.id === employee1.id && policy.leaveType === LeaveType.CASUAL) {
        pending = 3; // matches the 3-day pending casual leave
      }
      if (u.id === employee2.id && policy.leaveType === LeaveType.EARNED) {
        if (used < 2) used = 2; // matches the 2-day approved earned leave
      }

      if (used + pending > policy.daysAllowed) {
        used = policy.daysAllowed - pending;
      }

      const remaining = policy.daysAllowed - used;

      await prisma.leaveBalance.create({
        data: {
          userId: u.id,
          leaveType: policy.leaveType,
          year: 2026,
          allocated: policy.daysAllowed,
          used,
          pending,
          remaining
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

  // Helper to create due dates relative to today
  const daysFromNow = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  const tasksList = [
    // ── Admin User ──────────────────────────────────────────────────────────
    { title: "Renew office insurance policy", desc: "Coordinate with insurance broker and get updated certificates.", assigneeId: adminUser.id, priority: TaskPriority.HIGH, status: TaskStatus.ASSIGNED, due: daysFromNow(10), scope: TaskScope.PERSONAL },
    { title: "Q3 budget planning presentation", desc: "Prepare slides and projections for Q3 leadership review.", assigneeId: adminUser.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due: daysFromNow(5), scope: TaskScope.PERSONAL },
    { title: "Update company org chart", desc: "Reflect latest department restructuring in the org chart tool.", assigneeId: adminUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(7), scope: TaskScope.PERSONAL },
    { title: "Vendor contract renewals - Q2", desc: "Review and sign off on all vendor SLA extensions.", assigneeId: adminUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.CLOSED, due: daysFromNow(-3), scope: TaskScope.PERSONAL },
    { title: "Office relocation feasibility report", desc: "Compile cost comparison for moving to the proposed downtown location.", assigneeId: adminUser.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED, due: daysFromNow(-7), scope: TaskScope.PERSONAL },

    // ── HR User ─────────────────────────────────────────────────────────────
    { title: "Post open Senior Developer listing", desc: "Draft JD and post to Naukri, LinkedIn, and internal portal.", assigneeId: hrUser.id, priority: TaskPriority.HIGH, status: TaskStatus.ASSIGNED, due: daysFromNow(4), scope: TaskScope.PERSONAL },
    { title: "Schedule performance review cycle", desc: "Send calendar invites to all managers for mid-year reviews.", assigneeId: hrUser.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due: daysFromNow(6), scope: TaskScope.PERSONAL },
    { title: "Conduct intern exit evaluation", desc: "Evaluate performance, collect feedback, and finalize internship files.", assigneeId: hrUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(8), scope: TaskScope.PERSONAL },
    { title: "Audit Employee Handbook for hybrid policy", desc: "Update sections on remote/hybrid work compliance guidelines.", assigneeId: hrUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(12), scope: TaskScope.PERSONAL },
    { title: "Onboarding checklist for July joiners", desc: "Prepare system access, badge, and welcome kit for 3 new hires.", assigneeId: hrUser.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED, due: daysFromNow(-5), scope: TaskScope.PERSONAL },
    { title: "Compile Q2 attrition report", desc: "Analyse exit interviews and summarise reasons for leadership.", assigneeId: hrUser.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED, due: daysFromNow(-10), scope: TaskScope.PERSONAL },

    // ── Finance User ────────────────────────────────────────────────────────
    { title: "Prepare July payroll run inputs", desc: "Collect variable pay and reimbursement data from all departments.", assigneeId: financeUser.id, priority: TaskPriority.HIGH, status: TaskStatus.ASSIGNED, due: daysFromNow(3), scope: TaskScope.PERSONAL },
    { title: "Q2 expense receipt compliance audit", desc: "Verify ledger entries against scanned claim sheets for all employees.", assigneeId: financeUser.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due: daysFromNow(6), scope: TaskScope.PERSONAL },
    { title: "GST filing reconciliation", desc: "Reconcile input tax credit with filed returns for June quarter.", assigneeId: financeUser.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due: daysFromNow(9), scope: TaskScope.PERSONAL },
    { title: "Update tax slab config for FY 2026-27", desc: "Update finance system configuration values with new regime slabs.", assigneeId: financeUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(14), scope: TaskScope.PERSONAL },
    { title: "Audit petty cash disbursements - June", desc: "Verify petty cash register against receipts for June.", assigneeId: financeUser.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED, due: daysFromNow(-4), scope: TaskScope.PERSONAL },
    { title: "Vendor payment reconciliation - Q1", desc: "Match all Q1 vendor invoices with payment acknowledgements.", assigneeId: financeUser.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED, due: daysFromNow(-8), scope: TaskScope.PERSONAL },

    // ── Manager User ────────────────────────────────────────────────────────
    { title: "Set Q3 OKRs for sales team", desc: "Define key results and cascade targets to the Scranton reps.", assigneeId: managerUser.id, priority: TaskPriority.HIGH, status: TaskStatus.ASSIGNED, due: daysFromNow(5), scope: TaskScope.PERSONAL },
    { title: "Review team sales pipelines for Q3", desc: "Analyse CRM data and identify at-risk deals to accelerate.", assigneeId: managerUser.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due: daysFromNow(7), scope: TaskScope.PERSONAL },
    { title: "1-on-1 feedback sessions with reps", desc: "Conduct structured monthly 1-on-1s with all five direct reports.", assigneeId: managerUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(10), scope: TaskScope.PERSONAL },
    { title: "Submit client visit expense report", desc: "Upload receipts and submit reimbursement form for Lackawanna trip.", assigneeId: managerUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.CLOSED, due: daysFromNow(-2), scope: TaskScope.PERSONAL },
    { title: "Renew Lackawanna county paper contract", desc: "Negotiate terms and coordinate with the legal team for sign-off.", assigneeId: managerUser.id, priority: TaskPriority.HIGH, status: TaskStatus.CLOSED, due: daysFromNow(-6), scope: TaskScope.PERSONAL },

    // ── Employee 1 (Sales Rep) ───────────────────────────────────────────────
    { title: "Follow up with Prestige Paper lead", desc: "Send customised proposal deck and schedule a follow-up call.", assigneeId: employee1.id, priority: TaskPriority.HIGH, status: TaskStatus.ASSIGNED, due: daysFromNow(3), scope: TaskScope.PERSONAL },
    { title: "Update Salesforce pipeline for July", desc: "Mark deal stages and add meeting notes from last week.", assigneeId: employee1.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(5), scope: TaskScope.PERSONAL },
    { title: "Prepare product demo for Utica client", desc: "Customise demo environment and rehearse 30-min presentation.", assigneeId: employee1.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due: daysFromNow(8), scope: TaskScope.PERSONAL },
    { title: "Compile lost deals analysis - H1", desc: "List reasons for lost deals and propose corrective actions.", assigneeId: employee1.id, priority: TaskPriority.MEDIUM, status: TaskStatus.CLOSED, due: daysFromNow(-5), scope: TaskScope.PERSONAL },

    // ── Employee 2 (Senior Developer / Engineering Manager) ──────────────────
    {
      title: "Optimize AuditLog table indexes",
      desc: "Run query analysis and create compound indexes to cut p95 latency.",
      assigneeId: employee2.id,
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      due: daysFromNow(4),
      scope: TaskScope.DEPARTMENT,
      departmentId: depts.Engineering.id,
      comments: [
        { userId: employee3.id, body: "I ran a baseline index analysis, sending spreadsheet over." },
        { userId: employee2.id, body: "Thanks, please make sure we avoid duplicate indexes." }
      ]
    },
    {
      title: "Set up Redis caching for dashboard",
      desc: "Cache heavy dashboard queries with 5-min TTL using Redis.",
      assigneeId: employee2.id,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_REVIEW,
      due: daysFromNow(11),
      scope: TaskScope.TEAM,
      teamId: coreDevTeam.id,
      reviewerIds: [adminUser.id],
      comments: [
        { userId: employee2.id, body: "Implemented and verified cache hits locally." }
      ]
    },
    {
      title: "Fix prod bug: timezone offset in payroll",
      desc: "Resolved the UTC offset issue causing incorrect pay period cuts.",
      assigneeId: employee2.id,
      priority: TaskPriority.HIGH,
      status: TaskStatus.CLOSED,
      due: daysFromNow(-3),
      scope: TaskScope.PERSONAL
    },
    {
      title: "Migrate auth module to JWT RS256",
      desc: "Replace HS256 signing with RSA keypair and update docs.",
      assigneeId: employee2.id,
      priority: TaskPriority.HIGH,
      status: TaskStatus.ASSIGNED,
      due: daysFromNow(-2), // OVERDUE task!
      scope: TaskScope.PERSONAL
    },
    {
      title: "Code review: leave module PRs",
      desc: "Review and merge 4 open PRs on the leave management feature.",
      assigneeId: employee2.id,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.CHANGES_REQUESTED,
      due: daysFromNow(7),
      scope: TaskScope.DEPARTMENT,
      departmentId: depts.Engineering.id,
      isBlocked: true,
      blockerNote: "Waiting for QA Lead to run Playwright smoke tests.",
      comments: [
        { userId: employee3.id, body: "Blocked because Playwright test run is failing in CI." }
      ]
    },
    {
      title: "Write API docs for v2 endpoints",
      desc: "Document all new REST endpoints in Swagger and internal wiki.",
      assigneeId: employee2.id,
      priority: TaskPriority.LOW,
      status: TaskStatus.CLOSED,
      due: daysFromNow(-8),
      scope: TaskScope.PERSONAL
    },

    // ── Employee 3 (QA Engineer / Normal employee) ───────────────────────────
    {
      title: "Draft regression test plan for v2.4",
      desc: "Create test cases covering all new features in the upcoming release.",
      assigneeId: employee3.id,
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      due: daysFromNow(5),
      scope: TaskScope.TEAM,
      teamId: coreDevTeam.id,
      comments: [
        { userId: employee3.id, body: "Starting drafting the test cases for auth module." }
      ]
    },
    {
      title: "Draft QA unit testing checklist",
      desc: "Create a reusable testing template for all new feature PRs.",
      assigneeId: employee3.id,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.SUBMITTED, // Submitted task
      due: daysFromNow(7),
      scope: TaskScope.PERSONAL
    },
    {
      title: "Automate leave module smoke tests",
      desc: "Write Playwright scripts for the critical leave approval flows.",
      assigneeId: employee3.id,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.ASSIGNED,
      due: daysFromNow(-1), // OVERDUE task!
      scope: TaskScope.DEPARTMENT,
      departmentId: depts.Engineering.id
    },
    {
      title: "Verify payroll calculation edge cases",
      desc: "Test salary computation for part-month joiners and leavers.",
      assigneeId: employee3.id,
      priority: TaskPriority.HIGH,
      status: TaskStatus.CLOSED,
      due: daysFromNow(-4),
      scope: TaskScope.PERSONAL
    },
    {
      title: "Bug bash: attendance module",
      desc: "Found and logged 7 issues in attendance; 5 confirmed and fixed.",
      assigneeId: employee3.id,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.CLOSED,
      due: daysFromNow(-9),
      scope: TaskScope.PERSONAL
    },

    // ── Employee 4 (Office Admin) ─────────────────────────────────────────────
    { title: "Book meeting rooms for July all-hands", desc: "Reserve the main hall and arrange catering for 40 people.", assigneeId: employee4.id, priority: TaskPriority.MEDIUM, status: TaskStatus.ASSIGNED, due: daysFromNow(8), scope: TaskScope.PERSONAL },
    { title: "Audit paper supply - Scranton office", desc: "Count stock and place re-orders if below 20 boxes.", assigneeId: employee4.id, priority: TaskPriority.LOW, status: TaskStatus.IN_PROGRESS, due: daysFromNow(5), scope: TaskScope.PERSONAL },
    { title: "Coordinate laptop procurement for new hires", desc: "Raise PO for 3 MacBook Pros and track delivery status.", assigneeId: employee4.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due: daysFromNow(7), scope: TaskScope.PERSONAL },
    { title: "Update visitor access log system", desc: "Migrate visitor register from spreadsheet to the new SaaS tool.", assigneeId: employee4.id, priority: TaskPriority.MEDIUM, status: TaskStatus.CLOSED, due: daysFromNow(-6), scope: TaskScope.PERSONAL },

    // ── Employee 5 (Marketing Associate) ─────────────────────────────────────
    { title: "Plan Dunder Mifflin social media calendar", desc: "Prepare a 4-week content calendar for LinkedIn and Instagram.", assigneeId: employee5.id, priority: TaskPriority.HIGH, status: TaskStatus.ASSIGNED, due: daysFromNow(4), scope: TaskScope.PERSONAL },
    { title: "Design Q3 product brochure", desc: "Create updated product brochure reflecting new pricing tiers.", assigneeId: employee5.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(9), scope: TaskScope.PERSONAL },
    { title: "Write customer success case study", desc: "Interview Prestige Paper account and draft a 500-word case study.", assigneeId: employee5.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(12), scope: TaskScope.PERSONAL },
    { title: "Launch email campaign for summer promo", desc: "Set up drip sequence in Mailchimp targeting dormant accounts.", assigneeId: employee5.id, priority: TaskPriority.HIGH, status: TaskStatus.CLOSED, due: daysFromNow(-4), scope: TaskScope.PERSONAL },
    { title: "Compile brand asset library", desc: "Organised logos, fonts, and templates into Figma component library.", assigneeId: employee5.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED, due: daysFromNow(-10), scope: TaskScope.PERSONAL },

    // ── Intern User ───────────────────────────────────────────────────────────
    { title: "Research competitor HRMS features", desc: "List top 5 competitors and summarise key differentiating features.", assigneeId: internUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.ASSIGNED, due: daysFromNow(6), scope: TaskScope.PERSONAL },
    { title: "Filing and scanning intern reports", desc: "Scan exit surveys and file completed reports in cabinets.", assigneeId: internUser.id, priority: TaskPriority.LOW, status: TaskStatus.IN_PROGRESS, due: daysFromNow(4), scope: TaskScope.PERSONAL },
    { title: "Assist HR with onboarding docs", desc: "Help prepare welcome kits and system access request forms.", assigneeId: internUser.id, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due: daysFromNow(7), scope: TaskScope.PERSONAL },
    { title: "Shadow sales call with Utica client", desc: "Attend the demo and take structured notes for the team debrief.", assigneeId: internUser.id, priority: TaskPriority.LOW, status: TaskStatus.CLOSED, due: daysFromNow(-3), scope: TaskScope.PERSONAL }
  ];

  for (let i = 0; i < tasksList.length; i++) {
    const t = tasksList[i] as any;
    const taskRecord = await prisma.task.create({
      data: {
        taskId: `TASK-${String(i + 1).padStart(4, "0")}`,
        title: t.title,
        description: t.desc,
        creatorId: adminUser.id,
        assigneeId: t.assigneeId,
        priority: t.priority,
        status: t.status,
        dueDate: t.due,
        scope: t.scope || TaskScope.PERSONAL,
        orgId: org.id,
        teamId: t.teamId || null,
        departmentId: t.departmentId || null,
        isBlocked: t.isBlocked || false,
        blockerNote: t.blockerNote || null,
        reviewerIds: t.reviewerIds || []
      }
    });

    if (t.comments && t.comments.length > 0) {
      for (const c of t.comments) {
        await prisma.taskComment.create({
          data: {
            taskId: taskRecord.id,
            userId: c.userId,
            body: c.body
          }
        });
      }
    }
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
