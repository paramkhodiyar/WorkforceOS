import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  headId: z.string().optional().nullable(),
  employeeIds: z.array(z.string()).optional()
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  headId: z.string().optional().nullable(),
  employeeIds: z.array(z.string()).optional()
});
