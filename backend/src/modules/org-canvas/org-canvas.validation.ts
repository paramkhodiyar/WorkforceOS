import { z } from "zod";

export const reassignManagerSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newManagerId: z.string().nullable().optional()
});

export const reassignDepartmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newDepartmentId: z.string().nullable().optional(),
  newTeamId: z.string().nullable().optional()
});

export const moveTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  newDepartmentId: z.string().min(1, "New department ID is required")
});

export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  permissions: z.array(
    z.object({
      resource: z.string().min(1),
      action: z.string().min(1)
    })
  ).default([])
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters").optional(),
  permissions: z.array(
    z.object({
      resource: z.string().min(1),
      action: z.string().min(1)
    })
  ).optional()
});

export const assignRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
  action: z.enum(["add", "remove"])
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required")
});
