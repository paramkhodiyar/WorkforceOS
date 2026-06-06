import { Request, Response } from "express";
import { NotificationService } from "./notifications.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page, limit } = parsePagination(req.query);
  const unreadOnly = req.query.unreadOnly === "true";
  const type = req.query.type as any;

  const result = await NotificationService.getNotifications(userId, {
    unreadOnly,
    type,
    page,
    limit
  });

  return sendPaginated(res, result.notifications, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await NotificationService.markAsRead(req.params.id, userId);
  return sendSuccess(res, null, "Notification marked as read");
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await NotificationService.markAllAsRead(userId);
  return sendSuccess(res, null, "All notifications marked as read");
});

export const dismiss = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await NotificationService.dismiss(req.params.id, userId);
  return sendSuccess(res, null, "Notification dismissed");
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await NotificationService.getUnreadCount(userId);
  return sendSuccess(res, result);
});
