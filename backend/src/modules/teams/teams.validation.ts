import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().min(1),
  leadId: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional()
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  leadId: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional()
});
