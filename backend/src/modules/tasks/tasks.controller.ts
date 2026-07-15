import { Request, Response } from "express";
import { TasksService } from "./tasks.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { getFileUrl } from "../../utils/upload.util";
import { AppError } from "../../utils/errors.util";

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const creatorId = req.user!.id;
  const task = await TasksService.createTask(orgId, creatorId, req.body, req);
  return sendSuccess(res, task, "Task created successfully");
});

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { page, limit } = parsePagination(req.query);

  const filters = {
    status: req.query.status as any,
    assigneeId: req.query.assigneeId as string,
    creatorId: req.query.creatorId as string,
    priority: req.query.priority as any,
    fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
    toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    overdue: req.query.overdue === "true",
    departmentId: req.query.departmentId as string,
    teamId: req.query.teamId as string
  };

  const result = await TasksService.listTasks(orgId, req.user!, filters, page, limit);

  return sendPaginated(res, result.tasks, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const task = await TasksService.getTaskById(req.params.id, orgId, req.user!);
  return sendSuccess(res, task);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const updated = await TasksService.updateTask(req.params.id, orgId, actorId, req.body, req);
  return sendSuccess(res, updated, "Task updated successfully");
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const user = req.user!;
  await TasksService.deleteTask(req.params.id, orgId, user, req);
  return sendSuccess(res, null, "Task deleted successfully");
});

export const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const { assigneeId } = req.body;
  const updated = await TasksService.assignTask(req.params.id, orgId, assigneeId, actorId, req);
  return sendSuccess(res, updated, "Task assigned successfully");
});

export const acceptTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const userId = req.user!.id;
  const updated = await TasksService.acceptTask(req.params.id, orgId, userId, req);
  return sendSuccess(res, updated, "Task accepted");
});

export const submitTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const userId = req.user!.id;
  const updated = await TasksService.submitTask(req.params.id, orgId, userId, req);
  return sendSuccess(res, updated, "Task submitted");
});

export const reviewTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const reviewerId = req.user!.id;
  const { score, comment, action } = req.body;
  const updated = await TasksService.reviewTask(req.params.id, orgId, reviewerId, score, comment, action, req);
  return sendSuccess(res, updated, "Task review submitted");
});

export const resubmitTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const userId = req.user!.id;
  const updated = await TasksService.resubmitTask(req.params.id, orgId, userId, req);
  return sendSuccess(res, updated, "Task resubmitted");
});

export const closeTask = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const userId = req.user!.id;
  const updated = await TasksService.closeTask(req.params.id, orgId, userId, req);
  return sendSuccess(res, updated, "Task closed");
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const userId = req.user!.id;
  const { body } = req.body;
  const comment = await TasksService.addComment(req.params.id, orgId, userId, body, req);
  return sendSuccess(res, comment, "Comment added successfully");
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const result = await TasksService.listComments(req.params.id, page, limit);

  return sendPaginated(res, result.comments, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.id;
  const orgId = req.org!.id;
  const uploadedBy = req.user!.id;

  if (!req.file) {
    throw AppError.badRequest("No file uploaded");
  }

  const fileUrl = getFileUrl(req.file);
  const fileSize = req.file.size;
  const fileName = req.file.originalname;

  const attach = await TasksService.addAttachment(taskId, orgId, uploadedBy, fileUrl, fileName, fileSize);
  return sendSuccess(res, attach, "Attachment uploaded successfully");
});

export const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.id;
  const orgId = req.org!.id;
  const attachId = req.params.attachId;
  await TasksService.deleteAttachment(taskId, orgId, attachId);
  return sendSuccess(res, null, "Attachment deleted successfully");
});

export const addBlocker = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const { note } = req.body;
  if (!note) {
    throw AppError.badRequest("Blocker note is required");
  }
  const updated = await TasksService.addBlocker(req.params.id, orgId, note, actorId, req);
  return sendSuccess(res, updated, "Blocker flagged successfully");
});

export const resolveBlocker = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const updated = await TasksService.resolveBlocker(req.params.id, orgId, actorId, req);
  return sendSuccess(res, updated, "Blocker resolved successfully");
});
