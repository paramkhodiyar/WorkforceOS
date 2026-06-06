import { z } from "zod";
import { ExpenseStatus } from "@prisma/client";

export const createExpenseSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  incurredOn: z.preprocess((val) => new Date(val as string), z.date()),
  description: z.string().optional()
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  incurredOn: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  description: z.string().optional()
});

export const rejectExpenseSchema = z.object({
  reason: z.string().min(1)
});

export const getMyClaimsSchema = z.object({
  status: z.nativeEnum(ExpenseStatus).optional(),
  fromDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  toDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional())
});
