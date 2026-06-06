import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

export const checkInSchema = z.object({
  ipAddress: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  workMode: z.enum(["WFO", "WFM"]).optional().default("WFO")
});

export const adjustSchema = z.object({
  checkIn: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  checkOut: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().min(1)
});

export const getHistorySchema = z.object({
  fromDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  toDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  page: z.preprocess((val) => parseInt(val as string, 10) || 1, z.number().min(1).optional()),
  limit: z.preprocess((val) => parseInt(val as string, 10) || 10, z.number().min(1).optional())
});

export const getSummarySchema = z.object({
  month: z.preprocess((val) => parseInt(val as string, 10) || new Date().getMonth() + 1, z.number().min(1).max(12)),
  year: z.preprocess((val) => parseInt(val as string, 10) || new Date().getFullYear(), z.number().min(1900))
});
