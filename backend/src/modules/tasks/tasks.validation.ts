import { z } from "zod";
import { TaskStatus, TaskPriority, TaskScope } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  parentTaskId: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  scope: z.nativeEnum(TaskScope).optional().default(TaskScope.PERSONAL),
  teamId: z.string().optional(),
  departmentId: z.string().optional(),
  reviewerIds: z.array(z.string()).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  parentTaskId: z.string().optional(),
  scope: z.nativeEnum(TaskScope).optional(),
  teamId: z.string().optional(),
  departmentId: z.string().optional(),
  reviewerIds: z.array(z.string()).optional()
});

export const commentSchema = z.object({
  body: z.string().min(1)
});

export const reviewSchema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
  action: z.enum(["APPROVED", "CHANGES_REQUESTED"])
});

export const assignSchema = z.object({
  assigneeId: z.string().min(1)
});

export const getTasksFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().optional(),
  creatorId: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  fromDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  toDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  overdue: z.preprocess((val) => val === "true", z.boolean().optional()),
  page: z.preprocess((val) => parseInt(val as string, 10) || 1, z.number().min(1).optional()),
  limit: z.preprocess((val) => parseInt(val as string, 10) || 10, z.number().min(1).optional())
});
