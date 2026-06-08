import { Request, Response } from "express";
import { AttendanceService } from "./attendance.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";
import { prisma } from "../../config/database";

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const { ipAddress, gpsLat, gpsLng, workMode } = req.body;
  const record = await AttendanceService.checkIn(userId, orgId, ipAddress, gpsLat, gpsLng, workMode, req);
  return sendSuccess(res, record, "Checked in successfully");
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const record = await AttendanceService.checkOut(userId, orgId, req);
  return sendSuccess(res, record, "Checked out successfully");
});

export const breakStart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const record = await AttendanceService.breakStart(userId, orgId, req);
  return sendSuccess(res, record, "Break started");
});

export const breakEnd = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const record = await AttendanceService.breakEnd(userId, orgId, req);
  return sendSuccess(res, record, "Break ended");
});

export const getToday = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const record = await AttendanceService.getTodayRecord(userId);
  return sendSuccess(res, record);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page, limit } = parsePagination(req.query);
  const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
  const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

  const result = await AttendanceService.getHistory(userId, fromDate, toDate, page, limit);

  return sendPaginated(res, result.records, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const list = await AttendanceService.getAllAttendance(orgId);
  return sendSuccess(res, list);
});

export const getExceptions = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { page, limit } = parsePagination(req.query);
  const result = await AttendanceService.getExceptionsList(orgId, page, limit);

  return sendPaginated(res, result.records, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const adjust = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const adjustedBy = req.user!.id;
  const recordId = req.params.id;
  const record = await AttendanceService.adjust(orgId, recordId, req.body, adjustedBy, req);
  return sendSuccess(res, record, "Attendance record adjusted successfully");
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const month = parseInt(req.query.month as string, 10);
  const year = parseInt(req.query.year as string, 10);

  if (req.user!.id !== userId) {
    const systemRole = req.user!.systemRole;
    const isAdmin = systemRole === "SUPER_ADMIN" || systemRole === "ORG_ADMIN";
    const userRoles = req.user!.roles || [];
    const isHR = userRoles.some((r: any) => r.roleName === "HR_MANAGER");
    const isManager = userRoles.some((r: any) => r.roleName === "TEAM_MANAGER" || r.roleName === "DEPARTMENT_HEAD");

    const targetUser = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false }
    });
    const isTargetManager = targetUser?.managerId === req.user!.id;

    if (!isAdmin && !isHR && !isManager && !isTargetManager) {
      throw AppError.forbidden("Access denied: insufficient permissions to view other employee's attendance summary");
    }
  }

  const summary = await AttendanceService.getSummaryStats(userId, month, year);
  return sendSuccess(res, summary);
});
