import { prisma } from "../../config/database";
import { PayrollStatus, AuditAction, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { computeSalaryBreakdown, fetchActiveEmployeesForPayroll, computeLopDays } from "../../db/queries/payroll.queries";

export class PayrollService {
  static async getRuns(orgId: string, filters: { year?: number; status?: PayrollStatus }) {
    const where: any = { organizationId: orgId, isDeleted: false };
    if (filters.year) {
      where.year = filters.year;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const runs = await prisma.payrollRun.findMany({
      where,
      include: {
        records: {
          where: { isDeleted: false }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return runs.map(run => {
      const totalGross = run.records.reduce((sum, rec) => sum + rec.grossSalary, 0);
      const totalDeductions = run.records.reduce((sum, rec) => sum + rec.totalDeductions, 0);
      return {
        ...run,
        totalGross,
        totalDeductions
      };
    });
  }

  static async generateRun(orgId: string, month: number, year: number, actorId: string, req?: any) {
    const existing = await prisma.payrollRun.findUnique({
      where: {
        organizationId_month_year: {
          organizationId: orgId,
          month,
          year
        }
      }
    });

    if (existing && !existing.isDeleted) {
      throw AppError.conflict("Payroll run already generated for this month and year");
    }

    const run = await prisma.payrollRun.create({
      data: {
        organizationId: orgId,
        month,
        year,
        status: PayrollStatus.GENERATED,
        generatedBy: actorId,
        generatedAt: new Date()
      }
    });

    const employees = await fetchActiveEmployeesForPayroll(orgId);

    for (const emp of employees) {
      // ── Determine basic salary ─────────────────────────────────────────────
      let basic = emp.basicSalary ?? 25000; // prefer user-level basic salary
      if (!emp.basicSalary) {
        // Fallback to salary band defaults
        if (emp.salaryBand === "BAND_A") basic = 80000;
        else if (emp.salaryBand === "BAND_B") basic = 50000;
        else if (emp.salaryBand === "BAND_C") basic = 35000;
        else if (emp.salaryBand === "BAND_D") basic = 25000;
        else if (emp.salaryBand === "BAND_E") basic = 18000;
      }

      // ── LOP days from attendance ────────────────────────────────────────────
      const { lopDays, workingDays } = await computeLopDays(emp.id, month, year, orgId);

      // ── Full statutory breakdown ────────────────────────────────────────────
      const breakdown = computeSalaryBreakdown(basic, {
        bonus: 0,
        otherDeductions: 0,
        pfApplicable: emp.pfApplicable ?? true,
        taxRegime: (emp.taxRegime as "OLD" | "NEW") ?? "NEW",
        lopDays,
        workingDaysInMonth: workingDays,
        salaryCalculationType: emp.salaryCalculationType,
        customHra: emp.customHra,
        customAllowance: emp.customAllowance,
        customPf: emp.customPf,
        customTds: emp.customTds,
        employeeType: emp.employeeType
      });

      await prisma.payrollRecord.create({
        data: {
          payrollRunId: run.id,
          userId: emp.id,
          basicSalary: breakdown.basicSalary,
          hra: breakdown.hra,
          allowances: breakdown.allowances,
          bonus: breakdown.bonus,
          grossSalary: breakdown.grossSalary,
          pf: breakdown.pf,
          pfEmployerContribution: breakdown.pfEmployerContribution,
          esic: breakdown.esic,
          professionalTax: breakdown.professionalTax,
          tax: breakdown.tax,
          lopDays: breakdown.lopDays,
          lopDeduction: breakdown.lopDeduction,
          lateDeduction: breakdown.lateDeduction,
          otherDeductions: breakdown.otherDeductions,
          totalDeductions: breakdown.totalDeductions,
          netSalary: breakdown.netSalary,
          status: "DRAFT"
        }
      });
    }

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.CREATED,
      module: "payroll",
      targetId: run.id,
      targetType: "PayrollRun",
      req
    });

    return run;
  }

  static async getRunById(runId: string, orgId: string) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, organizationId: orgId, isDeleted: false },
      include: {
        records: {
          where: { isDeleted: false },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true } }
          }
        }
      }
    });

    if (!run) {
      throw AppError.notFound("Payroll run not found");
    }

    return run;
  }

  static async approveRun(runId: string, orgId: string, actorId: string, req?: any) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, organizationId: orgId, isDeleted: false },
      include: { records: true }
    });

    if (!run || run.status !== PayrollStatus.GENERATED) {
      throw AppError.badRequest("Payroll run cannot be approved in its current state");
    }

    const updated = await prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: PayrollStatus.APPROVED,
        approvedBy: actorId,
        approvedAt: new Date()
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.APPROVED,
      module: "payroll",
      targetId: runId,
      targetType: "PayrollRun",
      req
    });

    for (const record of run.records) {
      await NotificationService.notify(
        record.userId,
        NotificationType.SALARY_GENERATED,
        "Payslip Approved",
        `Your salary payslip for ${run.month}/${run.year} has been approved. Net: INR ${record.netSalary}`,
        { payrollRecordId: record.id }
      );
    }

    return updated;
  }

  static async markPaid(runId: string, orgId: string, actorId: string, req?: any) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, organizationId: orgId, isDeleted: false }
    });

    if (!run || run.status !== PayrollStatus.APPROVED) {
      throw AppError.badRequest("Payroll run cannot be marked as paid in its current state");
    }

    const updated = await prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: PayrollStatus.PAID,
        paidBy: actorId,
        paidAt: new Date()
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.STATUS_CHANGED,
      module: "payroll",
      targetId: runId,
      targetType: "PayrollRun",
      newValue: { status: PayrollStatus.PAID },
      req
    });

    return updated;
  }

  static async getEmployeePayslips(userId: string, year?: number, page = 1, limit = 10, orgId?: string, hasAllAccess = false) {
    const where: any = {
      isDeleted: false
    };

    if (hasAllAccess && orgId) {
      where.payrollRun = { organizationId: orgId };
    } else {
      where.userId = userId;
    }

    if (year) {
      where.payrollRun = { ...where.payrollRun, year };
    }

    const total = await prisma.payrollRecord.count({ where });
    const records = await prisma.payrollRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        payrollRun: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true } }
      }
    });

    return { records, total };
  }

  static async getPayslipById(recordId: string, orgId?: string, userId?: string) {
    const where: any = { id: recordId, isDeleted: false };
    if (orgId) {
      where.payrollRun = { organizationId: orgId };
    }
    if (userId) {
      where.userId = userId;
    }

    const record = await prisma.payrollRecord.findFirst({
      where,
      include: {
        payrollRun: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true, designation: true, employeeType: true } }
      }
    });

    if (!record) {
      throw AppError.notFound("Payslip record not found");
    }

    const month = record.payrollRun.month;
    const year = record.payrollRun.year;
    const recordUserId = record.userId;
    const recordOrgId = record.payrollRun.organizationId;

    // Get telemetry
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 1. Attendance stats
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: recordUserId,
        date: { gte: startDate, lte: endDate },
        isDeleted: false
      }
    });

    const presentDays = attendanceRecords.filter(a => ["PRESENT", "EARLY_DEP"].includes(a.status)).length;
    const lateDays = attendanceRecords.filter(a => a.status === "LATE").length;
    const absentDays = attendanceRecords.filter(a => a.status === "ABSENT").length;
    const halfDays = attendanceRecords.filter(a => a.status === "HALF_DAY").length;
    const leaveDays = attendanceRecords.filter(a => a.status === "ON_LEAVE").length;
    const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // 2. Approved leaves
    const approvedLeavesCount = await prisma.leaveRequest.count({
      where: {
        userId: recordUserId,
        status: "HR_APPROVED",
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      }
    });

    // 3. Tasks
    const assignedTasksCount = await prisma.task.count({
      where: {
        assigneeId: recordUserId,
        createdAt: { gte: startDate, lte: endDate },
        isDeleted: false
      }
    });

    const completedTasksCount = await prisma.task.count({
      where: {
        assigneeId: recordUserId,
        status: { in: ["APPROVED", "CLOSED"] },
        updatedAt: { gte: startDate, lte: endDate },
        isDeleted: false
      }
    });

    // 4. Pending Expense Claims
    const pendingExpenses = await prisma.expenseClaim.findMany({
      where: {
        userId: recordUserId,
        status: "FINANCE_APPROVED",
        isDeleted: false
      }
    });

    return {
      ...record,
      telemetry: {
        attendance: {
          presentDays,
          lateDays,
          absentDays,
          halfDays,
          leaveDays,
          totalDaysInMonth
        },
        leaves: {
          approvedLeavesCount
        },
        tasks: {
          assignedTasksCount,
          completedTasksCount,
          productivityRate: assignedTasksCount > 0 ? Math.round((completedTasksCount / assignedTasksCount) * 100) : 0
        },
        expenses: pendingExpenses
      }
    };
  }

  static async editPayslip(recordId: string, orgId: string, data: any, actorId: string, req?: any) {
    const record = await prisma.payrollRecord.findFirst({
      where: { id: recordId, isDeleted: false, payrollRun: { organizationId: orgId } },
      include: { payrollRun: true, user: true }
    });

    if (!record) {
      throw AppError.notFound("Payslip record not found");
    }

    if (record.status === "PAID" || record.payrollRun.status === "PAID") {
      throw AppError.badRequest("Cannot edit a disbursed payslip");
    }

    // Capture inputs
    const basicSalary = data.basicSalary !== undefined ? parseFloat(data.basicSalary) : record.basicSalary;
    const hra = data.hra !== undefined ? parseFloat(data.hra) : record.hra;
    const allowances = data.allowances !== undefined ? parseFloat(data.allowances) : record.allowances;
    const bonus = data.bonus !== undefined ? parseFloat(data.bonus) : record.bonus;
    const pf = data.pf !== undefined ? parseFloat(data.pf) : record.pf;
    const tax = data.tax !== undefined ? parseFloat(data.tax) : record.tax;
    const lopDays = data.lopDays !== undefined ? parseFloat(data.lopDays) : record.lopDays;
    
    const dailyWage = basicSalary / 30.0;
    const lopDeduction = data.lopDeduction !== undefined 
      ? parseFloat(data.lopDeduction) 
      : (data.lopDays !== undefined ? Math.round(lopDays * dailyWage * 100) / 100 : record.lopDeduction);
      
    const lateDeduction = data.lateDeduction !== undefined ? parseFloat(data.lateDeduction) : record.lateDeduction;
    const otherDeductions = data.otherDeductions !== undefined ? parseFloat(data.otherDeductions) : record.otherDeductions;
    const comments = data.comments !== undefined ? data.comments : record.comments;

    // Recalculate
    const grossSalary = basicSalary + hra + allowances + bonus;
    const professionalTax = (record.user.employeeType === "INTERN") ? 0 : 200;
    const esic = (record.user.employeeType === "INTERN" || grossSalary > 21000) ? 0 : Math.round(grossSalary * 0.0075 * 100) / 100;
    
    const totalDeductions = pf + tax + professionalTax + esic + lopDeduction + lateDeduction + otherDeductions;
    const netSalary = Math.max(grossSalary - totalDeductions, 0);

    const updated = await prisma.payrollRecord.update({
      where: { id: recordId },
      data: {
        basicSalary,
        hra,
        allowances,
        bonus,
        pf,
        tax,
        lopDays,
        lopDeduction,
        lateDeduction,
        otherDeductions,
        grossSalary,
        professionalTax,
        esic,
        totalDeductions,
        netSalary,
        comments
      },
      include: {
        payrollRun: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true, designation: true } }
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "payroll",
      targetId: recordId,
      targetType: "PayrollRecord",
      req
    });

    return updated;
  }

  static async disbursePayslip(recordId: string, orgId: string, paymentSlipUrl: string | undefined, remarks: string | undefined, actorId: string, req?: any) {
    const record = await prisma.payrollRecord.findFirst({
      where: { id: recordId, isDeleted: false, payrollRun: { organizationId: orgId } },
      include: { payrollRun: true }
    });

    if (!record) {
      throw AppError.notFound("Payslip record not found");
    }

    if (record.status === "PAID") {
      throw AppError.badRequest("Payslip is already marked as paid");
    }

    const updatedComments = remarks 
      ? (record.comments ? `${record.comments}\n\nDisbursement Notes: ${remarks}` : `Disbursement Notes: ${remarks}`)
      : record.comments;

    const updated = await prisma.payrollRecord.update({
      where: { id: recordId },
      data: {
        status: "PAID",
        paymentSlipUrl,
        comments: updatedComments
      },
      include: {
        payrollRun: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true, designation: true } }
      }
    });

    await NotificationService.notify(
      record.userId,
      NotificationType.SALARY_GENERATED,
      "Salary Disbursed",
      `Your salary payslip for ${record.payrollRun.month}/${record.payrollRun.year} has been disbursed. Net Take Home: INR ${record.netSalary}`,
      { payrollRecordId: record.id }
    );

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.STATUS_CHANGED,
      module: "payroll",
      targetId: recordId,
      targetType: "PayrollRecord",
      newValue: { status: "PAID" },
      req
    });

    return updated;
  }

  static async exportRun(runId: string, orgId: string) {
    return this.getRunById(runId, orgId);
  }
}
