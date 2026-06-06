import { z } from "zod";

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  salaryBand: z.string().optional(),
  joinDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
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
  salaryBand: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  joinDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
});
