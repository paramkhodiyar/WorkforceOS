import { prisma } from "../../config/database";
import { PayrollStatus, AuditAction, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { computeSalaryBreakdown, fetchActiveEmployeesForPayroll } from "../../db/queries/payroll.queries";

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
      let basic = 25000;
      if (emp.salaryBand === "BAND_A") basic = 80000;
      else if (emp.salaryBand === "BAND_B") basic = 50000;
      else if (emp.salaryBand === "BAND_C") basic = 30000;
      else if (emp.salaryBand) {
        const parsed = parseInt(emp.salaryBand, 10);
        if (!isNaN(parsed)) basic = parsed;
      }

      let breakdown;
      if (emp.systemRole === "INTERN") {
        breakdown = {
          basicSalary: basic,
          hra: 0,
          allowances: 0,
          bonus: 0,
          grossSalary: basic,
          pf: 0,
          tax: 0,
          otherDeductions: 0,
          totalDeductions: 0,
          netSalary: basic
        };
      } else {
        breakdown = computeSalaryBreakdown(basic);
      }

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
          tax: breakdown.tax,
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

  static async getEmployeePayslips(userId: string, year?: number, page = 1, limit = 10) {
    const where: any = {
      userId,
      isDeleted: false
    };

    if (year) {
      where.payrollRun = { year };
    }

    const total = await prisma.payrollRecord.count({ where });
    const records = await prisma.payrollRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        payrollRun: true
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
