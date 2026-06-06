import { prisma } from "../../config/database";

export interface SalaryBreakdown {
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  grossSalary: number;
  pf: number;
  tax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
}

export function computeSalaryBreakdown(basicSalary: number, bonus = 0, otherDeductions = 0): SalaryBreakdown {
  const hra = basicSalary * 0.40;
  const allowances = basicSalary * 0.10;
  const grossSalary = basicSalary + hra + allowances + bonus;

  const pf = Math.min(basicSalary * 0.12, 1800);

  const annualGross = grossSalary * 12;
  let annualTax = 0;

  if (annualGross > 1500000) {
    annualTax = 150000 + (annualGross - 1500000) * 0.30;
  } else if (annualGross > 1200000) {
    annualTax = 90000 + (annualGross - 1200000) * 0.20;
  } else if (annualGross > 900000) {
    annualTax = 45000 + (annualGross - 900000) * 0.15;
  } else if (annualGross > 600000) {
    annualTax = 15000 + (annualGross - 600000) * 0.10;
  } else if (annualGross > 300000) {
    annualTax = (annualGross - 300000) * 0.05;
  }

  const tax = Math.round((annualTax / 12) * 100) / 100;
  const totalDeductions = pf + tax + otherDeductions;
  const netSalary = grossSalary - totalDeductions;

  return {
    basicSalary,
    hra,
    allowances,
    bonus,
    grossSalary,
    pf,
    tax,
    otherDeductions,
    totalDeductions,
    netSalary
  };
}

export async function fetchActiveEmployeesForPayroll(orgId: string) {
  return prisma.user.findMany({
    where: {
      organizationId: orgId,
      status: "ACTIVE",
      isDeleted: false,
      salaryBand: { not: null }
    }
  });
}
