import { z } from "zod";
import { PayrollStatus } from "@prisma/client";

export const getRunsSchema = z.object({
  year: z.preprocess((val) => (val ? parseInt(val as string, 10) : undefined), z.number().min(1900).optional()),
  status: z.nativeEnum(PayrollStatus).optional()
});

export const generateRunSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(1900)
});

export const myPayslipsSchema = z.object({
  year: z.preprocess((val) => (val ? parseInt(val as string, 10) : undefined), z.number().min(1900).optional()),
  page: z.preprocess((val) => parseInt(val as string, 10) || 1, z.number().min(1).optional()),
  limit: z.preprocess((val) => parseInt(val as string, 10) || 10, z.number().min(1).optional())
});
