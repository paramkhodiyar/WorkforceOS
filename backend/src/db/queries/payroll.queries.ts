import { prisma } from "../../config/database";

export interface SalaryBreakdown {
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  grossSalary: number;
  pf: number;
  pfEmployerContribution: number;
  esic: number;
  professionalTax: number;
  tax: number;
  lopDays: number;
  lopDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
}

/**
 * Professional Tax slabs (monthly gross, Indian states — standard slab).
 * Most states align to ₹200/month for salaries above ₹15,000.
 */
function calcProfessionalTax(monthlyGross: number): number {
  if (monthlyGross > 15000) return 200;
  if (monthlyGross > 10000) return 150;
  if (monthlyGross > 7500) return 75;
  return 0;
}

/**
 * ESIC (Employee State Insurance Corporation) applies to employees with gross ≤ ₹21,000/month.
 * Employee contribution: 0.75% of gross salary.
 * Employer contribution: 3.25% of gross salary (stored separately for payslip display).
 */
function calcEsic(monthlyGross: number): { employee: number; employer: number } {
  if (monthlyGross > 21000) return { employee: 0, employer: 0 };
  return {
    employee: Math.round(monthlyGross * 0.0075 * 100) / 100,
    employer: Math.round(monthlyGross * 0.0325 * 100) / 100
  };
}

/**
 * PF (Provident Fund) — capped at 12% of ₹15,000 (₹1,800/month) per EPFO rules.
 * Employer also contributes 12% (capped).
 */
function calcPf(basicSalary: number, pfApplicable: boolean): { employee: number; employer: number } {
  if (!pfApplicable) return { employee: 0, employer: 0 };
  const pfBase = Math.min(basicSalary, 15000);
  const pf = Math.round(pfBase * 0.12 * 100) / 100;
  return { employee: pf, employer: pf };
}

/**
 * Income tax (TDS) per month — New Tax Regime slabs (FY 2024-25+).
 * Applied on annual gross. Returns monthly TDS.
 */
function calcMonthlyTds(annualGross: number): number {
  // Standard deduction of ₹75,000 for salaried employees under new regime
  const taxableIncome = Math.max(annualGross - 75000, 0);
  let annualTax = 0;

  if (taxableIncome <= 300000) {
    annualTax = 0;
  } else if (taxableIncome <= 600000) {
    annualTax = (taxableIncome - 300000) * 0.05;
  } else if (taxableIncome <= 900000) {
    annualTax = 15000 + (taxableIncome - 600000) * 0.10;
  } else if (taxableIncome <= 1200000) {
    annualTax = 45000 + (taxableIncome - 900000) * 0.15;
  } else if (taxableIncome <= 1500000) {
    annualTax = 90000 + (taxableIncome - 1200000) * 0.20;
  } else {
    annualTax = 150000 + (taxableIncome - 1500000) * 0.30;
  }

  // 4% education + health cess
  annualTax = annualTax * 1.04;

  return Math.round((annualTax / 12) * 100) / 100;
}

/**
 * Compute a full salary breakdown for a given employee.
 *
 * @param basicSalary       - employee's monthly basic salary
 * @param options.bonus     - any performance / festival bonus this month
 * @param options.otherDeductions - other misc deductions
 * @param options.pfApplicable   - whether PF is applicable
 * @param options.taxRegime      - 'OLD' | 'NEW' (NEW regime is used; OLD regime TDS calc to be added later)
 * @param options.lopDays        - number of Loss of Pay days this month
 * @param options.workingDaysInMonth - total working days in the month (default 26)
 */
export function computeSalaryBreakdown(
  basicSalary: number,
  options: {
    bonus?: number;
    otherDeductions?: number;
    pfApplicable?: boolean;
    taxRegime?: "OLD" | "NEW";
    lopDays?: number;
    workingDaysInMonth?: number;
  } = {}
): SalaryBreakdown {
  const {
    bonus = 0,
    otherDeductions = 0,
    pfApplicable = true,
    lopDays = 0,
    workingDaysInMonth = 26
  } = options;

  // ── LOP deduction ─────────────────────────────────────────────────────────
  // Per-day salary = CTC monthly / working days
  const totalMonthlyCTC = basicSalary * 1.5; // basic + HRA(40%) + allowances(10%) = 1.5x
  const perDaySalary = workingDaysInMonth > 0 ? totalMonthlyCTC / workingDaysInMonth : 0;
  const lopDeduction = Math.round(lopDays * perDaySalary * 100) / 100;

  // ── Gross computation (before LOP) ────────────────────────────────────────
  const hra = basicSalary * 0.40;
  const allowances = basicSalary * 0.10;
  const grossBeforeLop = basicSalary + hra + allowances + bonus;
  const grossSalary = Math.max(grossBeforeLop - lopDeduction, 0);

  // ── Statutory deductions ──────────────────────────────────────────────────
  const { employee: pfEmployee, employer: pfEmployer } = calcPf(basicSalary, pfApplicable);
  const { employee: esicEmployee } = calcEsic(grossSalary);
  const professionalTax = calcProfessionalTax(grossSalary);
  const tax = calcMonthlyTds(grossSalary * 12);

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalDeductions =
    pfEmployee + esicEmployee + professionalTax + tax + otherDeductions;
  const netSalary = Math.max(grossSalary - totalDeductions, 0);

  return {
    basicSalary: Math.round(basicSalary * 100) / 100,
    hra: Math.round(hra * 100) / 100,
    allowances: Math.round(allowances * 100) / 100,
    bonus: Math.round(bonus * 100) / 100,
    grossSalary: Math.round(grossSalary * 100) / 100,
    pf: Math.round(pfEmployee * 100) / 100,
    pfEmployerContribution: Math.round(pfEmployer * 100) / 100,
    esic: Math.round(esicEmployee * 100) / 100,
    professionalTax: Math.round(professionalTax * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    lopDays,
    lopDeduction: Math.round(lopDeduction * 100) / 100,
    otherDeductions: Math.round(otherDeductions * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100
  };
}

export async function fetchActiveEmployeesForPayroll(orgId: string) {
  return prisma.user.findMany({
    where: {
      organizationId: orgId,
      status: "ACTIVE",
      isDeleted: false
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeId: true,
      designation: true,
      systemRole: true,
      salaryBand: true,
      basicSalary: true,
      pfApplicable: true,
      taxRegime: true,
      employeeType: true
    }
  });
}

/**
 * Compute the number of LOP (Loss of Pay) days for a user in a given month.
 * LOP days = working days in month minus (present + late + on_leave + half_day * 0.5) days.
 * Returns a non-negative count.
 */
export async function computeLopDays(
  userId: string,
  month: number,
  year: number,
  organizationId: string
): Promise<{ lopDays: number; workingDays: number }> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // last day of month

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      isDeleted: false
    }
  });

  let paidDays = 0;
  for (const att of attendanceRecords) {
    if (
      att.status === "PRESENT" ||
      att.status === "LATE" ||
      att.status === "ON_LEAVE" ||
      att.status === "EARLY_DEP"
    ) {
      paidDays += 1;
    } else if (att.status === "HALF_DAY") {
      paidDays += 0.5;
    }
    // ABSENT = 0 (LOP day)
  }

  // Calculate weekends (Saturdays and Sundays)
  let weekendCount = 0;
  const holidaysInMonth = await prisma.holiday.findMany({
    where: {
      organizationId,
      date: { gte: startDate, lte: endDate }
    }
  });

  const holidayDates = new Set(
    holidaysInMonth.map(h => h.date.toISOString().split("T")[0])
  );

  let tempDate = new Date(Date.UTC(year, month - 1, 1));
  const endDateUTC = new Date(Date.UTC(year, month, 0));
  let weekdayHolidays = 0;
  
  while (tempDate <= endDateUTC) {
    const dayOfWeek = tempDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      weekendCount++;
    } else {
      const dateStr = tempDate.toISOString().split("T")[0];
      if (holidayDates.has(dateStr)) {
        weekdayHolidays++;
      }
    }
    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
  }

  const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const workingDays = totalDaysInMonth - weekendCount - weekdayHolidays;

  const lopDays = Math.max(workingDays - paidDays, 0);
  return {
    lopDays: Math.round(lopDays * 100) / 100,
    workingDays
  };
}
