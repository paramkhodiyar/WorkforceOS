import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  isAllDay: z.boolean().optional().default(false),
  meetingLink: z.string().url("Invalid meeting link URL").or(z.string().length(0)).optional().or(z.null()),
  recurrenceType: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional().default("NONE"),
  recurrenceInterval: z.number().int().min(1).optional().default(1),
  recurrenceDays: z.string().optional().or(z.null()),
  recurrenceEndDate: z.string().datetime().optional().or(z.null()),
  inviteeIds: z.array(z.string()).optional().default([])
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: "Start time must be before end time",
  path: ["endTime"]
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().or(z.null()),
  location: z.string().optional().or(z.null()),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isAllDay: z.boolean().optional(),
  meetingLink: z.string().url().or(z.string().length(0)).optional().or(z.null()),
  recurrenceType: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceInterval: z.number().int().min(1).optional(),
  recurrenceDays: z.string().optional().or(z.null()),
  recurrenceEndDate: z.string().datetime().optional().or(z.null()),
  inviteeIds: z.array(z.string()).optional()
}).refine(data => {
  if (data.startTime && data.endTime) {
    return new Date(data.startTime) < new Date(data.endTime);
  }
  return true;
}, {
  message: "Start time must be before end time",
  path: ["endTime"]
});

export const respondEventSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "TENTATIVE"])
});

export const checkAvailabilitySchema = z.object({
  inviteeIds: z.array(z.string()).min(1, "At least one invitee is required"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format")
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: "Start time must be before end time",
  path: ["endTime"]
});
