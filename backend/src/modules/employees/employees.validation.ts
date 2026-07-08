import { z } from "zod";
import { EmployeeType, TaxRegime, SalaryBand, SystemRole, LeaveType } from "@prisma/client";

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  
  dateOfBirth: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  personalEmail: z.string().email().optional(),
  personalPhone: z.string().optional(),
  
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().optional()
  }).optional(),
  
  employeeType: z.nativeEnum(EmployeeType).optional(),
  workLocation: z.string().optional(),
  shiftId: z.string().optional(),
  joinDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  probationEndDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  systemRole: z.nativeEnum(SystemRole).optional(),
  
  salaryBand: z.nativeEnum(SalaryBand).optional(),
  basicSalary: z.number().positive().optional(),
  pfApplicable: z.boolean().optional(),
  taxRegime: z.nativeEnum(TaxRegime).optional(),
  ctcAnnual: z.number().positive().optional(),
  
  bankDetail: z.object({
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    ifscCode: z.string().min(1),
    accountHolderName: z.string().min(1),
    panNumber: z.string().min(1),
    aadhaarLast4: z.string().optional()
  }).optional(),
  
  emergencyContact: z.object({
    name: z.string().min(1),
    relation: z.string().min(1),
    phone: z.string().min(1),
    altPhone: z.string().optional()
  }).optional(),

  leaveAllocations: z.array(z.object({
    leaveType: z.nativeEnum(LeaveType),
    allocated: z.number().int().nonnegative()
  })).optional()
});

export const updateEmployeeSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  
  dateOfBirth: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  personalEmail: z.string().email().optional(),
  personalPhone: z.string().optional(),
  
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().optional()
  }).optional(),
  
  employeeType: z.nativeEnum(EmployeeType).optional(),
  workLocation: z.string().optional(),
  shiftId: z.string().optional(),
  joinDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  probationEndDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  systemRole: z.nativeEnum(SystemRole).optional(),
  
  salaryBand: z.nativeEnum(SalaryBand).optional(),
  basicSalary: z.number().positive().optional(),
  pfApplicable: z.boolean().optional(),
  taxRegime: z.nativeEnum(TaxRegime).optional(),
  ctcAnnual: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  bankDetail: z.object({
    bankName: z.string().min(1).optional(),
    accountNumber: z.string().min(1).optional(),
    ifscCode: z.string().min(1).optional(),
    accountHolderName: z.string().min(1).optional(),
    panNumber: z.string().min(1).optional(),
    aadhaarLast4: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string().min(1).optional(),
    relation: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    altPhone: z.string().optional()
  }).optional(),
  leaveAllocations: z.array(z.object({
    leaveType: z.nativeEnum(LeaveType),
    allocated: z.number().int().nonnegative()
  })).optional()
});
