import { Request, Response } from "express";
import { CalendarService } from "./calendar.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const startStr = req.query.start as string;
  const endStr = req.query.end as string;

  if (!startStr || !endStr) {
    throw AppError.badRequest("start and end date query parameters are required");
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw AppError.badRequest("Invalid start or end date format");
  }

  const events = await CalendarService.listEvents(userId, orgId, start, end);
  return sendSuccess(res, events);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const creatorId = req.user!.id;
  const event = await CalendarService.createEvent(orgId, creatorId, req.body, req);
  return sendSuccess(res, event, "Calendar event created successfully", 201);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const event = await CalendarService.updateEvent(req.params.id, orgId, actorId, req.body, req);
  return sendSuccess(res, event, "Calendar event updated successfully");
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const result = await CalendarService.deleteEvent(req.params.id, orgId, actorId, req);
  return sendSuccess(res, result, "Calendar event deleted successfully");
});

export const deleteInstance = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const dateStr = req.query.date as string;

  if (!dateStr) {
    throw AppError.badRequest("date query parameter is required to delete an instance");
  }

  const result = await CalendarService.deleteInstance(req.params.id, orgId, actorId, dateStr, req);
  return sendSuccess(res, result, "Event occurrence cancelled successfully");
});

export const respondEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const result = await CalendarService.respondEvent(req.params.id, userId, orgId, req.body.status, req);
  return sendSuccess(res, result, "Invitation response updated successfully");
});

export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { inviteeIds, startTime, endTime } = req.body;
  
  const start = new Date(startTime);
  const end = new Date(endTime);

  const availability = await CalendarService.checkAvailability(orgId, inviteeIds, start, end);
  return sendSuccess(res, availability);
});
