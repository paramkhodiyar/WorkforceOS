import { z } from "zod";
import { SalaryBand, TaxRegime } from "@prisma/client";

export const onboardingEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentName: z.string().optional(),
  managerEmail: z.string().optional(),
  salaryBand: z.nativeEnum(SalaryBand).optional(),
  basicSalary: z.number().nonnegative().optional(),
  ctcAnnual: z.number().nonnegative().optional(),
  taxRegime: z.nativeEnum(TaxRegime).optional().default(TaxRegime.NEW),
});

export const onboardingSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationSlug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  defaultPassword: z.string().min(6, "Default password must be at least 6 characters"),
  employees: z.array(onboardingEmployeeSchema).min(1, "At least one employee is required"),
  orgAdminEmail: z.string().email("Invalid admin email"),
  logoUrl: z.string().optional(),
  hrEmails: z.array(z.string().email()).optional().default([]),
  financeEmails: z.array(z.string().email()).optional().default([]),
});
