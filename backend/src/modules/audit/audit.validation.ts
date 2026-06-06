import { z } from "zod";
import { AuditAction } from "@prisma/client";

export const getAuditLogsSchema = z.object({
  actorId: z.string().optional(),
  module: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  fromDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  toDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  page: z.preprocess((val) => parseInt(val as string, 10) || 1, z.number().min(1).optional()),
  limit: z.preprocess((val) => parseInt(val as string, 10) || 10, z.number().min(1).optional())
});
