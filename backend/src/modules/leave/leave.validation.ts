import { z } from "zod";
import { LeaveType } from "@prisma/client";

export const applyLeaveSchema = z.object({
  leaveType: z.nativeEnum(LeaveType),
  startDate: z.preprocess((val) => new Date(val as string), z.date()),
  endDate: z.preprocess((val) => new Date(val as string), z.date()),
  reason: z.string().min(1)
});

export const approveSchema = z.object({
  comment: z.string().optional()
});

export const rejectSchema = z.object({
  comment: z.string().min(1)
});

export const getCalendarSchema = z.object({
  departmentId: z.string().optional(),
  month: z.preprocess((val) => parseInt(val as string, 10) || new Date().getMonth() + 1, z.number().min(1).max(12).optional()),
  year: z.preprocess((val) => parseInt(val as string, 10) || new Date().getFullYear(), z.number().min(1900).optional())
});

export const policySchema = z.object({
  leaveType: z.nativeEnum(LeaveType),
  daysAllowed: z.number().min(1)
});
