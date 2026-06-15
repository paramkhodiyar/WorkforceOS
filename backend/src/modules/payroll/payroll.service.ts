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

      // ── Interns: simple stipend, no statutory deductions ──────────────────
      if (emp.employeeType === "INTERN" || emp.systemRole === "INTERN") {
        await prisma.payrollRecord.create({
          data: {
            payrollRunId: run.id,
            userId: emp.id,
            basicSalary: basic,
            hra: 0,
            allowances: 0,
            bonus: 0,
            grossSalary: basic,
            pf: 0,
            pfEmployerContribution: 0,
            esic: 0,
            tax: 0,
            lopDays: 0,
            lopDeduction: 0,
            otherDeductions: 0,
            totalDeductions: 0,
            netSalary: basic
          }
        });
        continue;
      }

      // ── LOP days from attendance ────────────────────────────────────────────
      // Standard working days in a month = 26 (Mon–Sat). Adjust if needed.
      const WORKING_DAYS_PER_MONTH = 26;
      const lopDays = await computeLopDays(emp.id, month, year, WORKING_DAYS_PER_MONTH);

      // ── Full statutory breakdown ────────────────────────────────────────────
      const breakdown = computeSalaryBreakdown(basic, {
        bonus: 0,
        otherDeductions: 0,
        pfApplicable: emp.pfApplicable ?? true,
        taxRegime: (emp.taxRegime as "OLD" | "NEW") ?? "NEW",
        lopDays,
        workingDaysInMonth: WORKING_DAYS_PER_MONTH
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
          otherDeductions: breakdown.otherDeductions,
          totalDeductions: breakdown.totalDeductions,
          netSalary: breakdown.netSalary
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
        user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true, designation: true } }
      }
    });

    if (!record) {
      throw AppError.notFound("Payslip record not found");
    }

    return record;
  }

  static async exportRun(runId: string, orgId: string) {
    return this.getRunById(runId, orgId);
  }
}
