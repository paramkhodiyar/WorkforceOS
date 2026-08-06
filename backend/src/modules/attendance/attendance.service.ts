import { prisma } from "../../config/database";
import { AttendanceStatus, AuditAction } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { getAttendanceExceptions, getAttendanceSummary } from "../../db/queries/attendance.queries";

export class AttendanceService {
  static getTodayDate() {
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const [{ value: month }, , { value: day }, , { value: year }] = formatter.formatToParts(new Date());
    const dateStr = `${year}-${month}-${day}`;
    return new Date(dateStr);
  }

  static async checkIn(userId: string, orgId: string, ipAddress?: string, gpsLat?: number, gpsLng?: number, workMode?: any, req?: any) {
    const today = this.getTodayDate();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    if (existing && existing.checkIn) {
      throw AppError.badRequest("Already checked in today");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shift: true }
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    let shift = user.shift;
    if (!shift) {
      shift = await prisma.shiftConfig.findFirst({
        where: { organizationId: orgId, isDefault: true, isDeleted: false }
      });
    }

    const checkInTime = new Date();
    let isLate = false;

    if (shift) {
      const [deadlineHour, deadlineMin] = shift.checkInDeadline.split(":").map(Number);
      const checkInHour = checkInTime.getHours();
      const checkInMin = checkInTime.getMinutes();

      if (checkInHour > deadlineHour || (checkInHour === deadlineHour && checkInMin > deadlineMin)) {
        isLate = true;
      }
    } else {
      isLate = checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30);
    }

    const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    let notes: string | undefined = undefined;
    const settings = await prisma.orgSettings.findUnique({
      where: { organizationId: orgId }
    });
    const OFFICE_LAT = settings?.officeLatitude ?? 12.9716;
    const OFFICE_LNG = settings?.officeLongitude ?? 77.5946;
    const MAX_RADIUS_METERS = settings?.officeRadius ?? 200;

    if (workMode === "WFO" && gpsLat !== undefined && gpsLng !== undefined && gpsLat !== null && gpsLng !== null) {
      const R = 6371e3; // Earth's radius in meters
      const phi1 = (OFFICE_LAT * Math.PI) / 180;
      const phi2 = (gpsLat * Math.PI) / 180;
      const deltaPhi = ((gpsLat - OFFICE_LAT) * Math.PI) / 180;
      const deltaLambda = ((gpsLng - OFFICE_LNG) * Math.PI) / 180;

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // in meters

      if (distance > MAX_RADIUS_METERS) {
        const distKm = (distance / 1000).toFixed(2);
        notes = `Flagged: Outside Bounds (${distKm}km away)`;
      }
    }

    // WFH: validate against user's home location if configured
    if (workMode === "WFH" && gpsLat !== undefined && gpsLng !== undefined && gpsLat !== null && gpsLng !== null) {
      const homeLat = user.homeLatitude;
      const homeLng = user.homeLongitude;
      const homeRadius = user.homeRadius ?? 200;

      if (homeLat !== null && homeLat !== undefined && homeLng !== null && homeLng !== undefined) {
        const R = 6371e3;
        const phi1 = (homeLat * Math.PI) / 180;
        const phi2 = (gpsLat * Math.PI) / 180;
        const deltaPhi = ((gpsLat - homeLat) * Math.PI) / 180;
        const deltaLambda = ((gpsLng - homeLng) * Math.PI) / 180;

        const a =
          Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance > homeRadius) {
          const distKm = (distance / 1000).toFixed(2);
          notes = `Flagged: Outside Home Bounds (${distKm}km away)`;
        }
      }
      // If no home location configured, no flagging — warning is shown on frontend
    }

    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        checkIn: checkInTime,
        status,
        workMode: workMode || "WFO",
        ipAddress,
        gpsLat,
        gpsLng,
        notes
      },
      create: {
        userId,
        date: today,
        checkIn: checkInTime,
        status,
        workMode: workMode || "WFO",
        ipAddress,
        gpsLat,
        gpsLng,
        notes
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.CREATED,
      module: "attendance",
      targetId: record.id,
      targetType: "Attendance",
      req
    });

    return record;
  }

  static async checkOut(userId: string, orgId: string, req?: any) {
    const today = this.getTodayDate();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { breaks: true }
    });

    if (!existing || !existing.checkIn) {
      throw AppError.badRequest("No check-in record found for today");
    }

    if (existing.checkOut) {
      throw AppError.badRequest("Already checked out today");
    }

    const checkOutTime = new Date();
    let totalHours = (checkOutTime.getTime() - existing.checkIn.getTime()) / (1000 * 60 * 60);

    let totalBreakMs = 0;
    for (const b of existing.breaks) {
      const end = b.breakEnd || new Date();
      totalBreakMs += (end.getTime() - b.breakStart.getTime());
    }
    const breakHours = totalBreakMs / (1000 * 60 * 60);
    totalHours = Math.max(0, totalHours - breakHours);

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutTime,
        totalHours: Math.round(totalHours * 100) / 100
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.UPDATED,
      module: "attendance",
      targetId: record.id,
      targetType: "Attendance",
      req
    });

    return record;
  }

  static async breakStart(userId: string, orgId: string, req?: any) {
    const today = this.getTodayDate();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { breaks: true }
    });

    if (!existing || !existing.checkIn) {
      throw AppError.badRequest("No check-in record found for today");
    }

    const activeBreak = existing.breaks.find(b => !b.breakEnd);
    if (activeBreak) {
      throw AppError.badRequest("Break already started");
    }

    await prisma.attendanceBreak.create({
      data: {
        attendanceId: existing.id,
        breakStart: new Date()
      }
    });

    const record = await prisma.attendance.findUnique({
      where: { id: existing.id },
      include: { breaks: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.UPDATED,
      module: "attendance",
      targetId: existing.id,
      targetType: "Attendance",
      newValue: { breakStart: true },
      req
    });

    return record!;
  }

  static async breakEnd(userId: string, orgId: string, req?: any) {
    const today = this.getTodayDate();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { breaks: true }
    });

    if (!existing) {
      throw AppError.badRequest("No attendance record found for today");
    }

    const activeBreak = existing.breaks.find(b => !b.breakEnd);
    if (!activeBreak) {
      throw AppError.badRequest("Break has not been started");
    }

    await prisma.attendanceBreak.update({
      where: { id: activeBreak.id },
      data: { breakEnd: new Date() }
    });

    const record = await prisma.attendance.findUnique({
      where: { id: existing.id },
      include: { breaks: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.UPDATED,
      module: "attendance",
      targetId: record!.id,
      targetType: "Attendance",
      newValue: { breakEnd: true },
      req
    });

    return record!;
  }

  static async getTodayRecord(userId: string) {
    const today = this.getTodayDate();
    return prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } }
    });
  }

  static async getHistory(userId: string, fromDate?: Date, toDate?: Date, page = 1, limit = 10) {
    const where: any = { userId, isDeleted: false };
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = fromDate;
      if (toDate) where.date.lte = toDate;
    }

    const total = await prisma.attendance.count({ where });
    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit
    });

    return { records, total };
  }

  static async getTeamAttendance(managerId: string, orgId: string) {
    const today = this.getTodayDate();
    return prisma.user.findMany({
      where: {
        managerId,
        organizationId: orgId,
        isDeleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        attendances: {
          where: { date: today }
        }
      }
    });
  }

  static async getAllAttendance(orgId: string) {
    const today = this.getTodayDate();
    return prisma.user.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        attendances: {
          where: { date: today }
        }
      }
    });
  }

  static async getDepartmentAttendance(userId: string, orgId: string) {
    const today = this.getTodayDate();
    const depts = await prisma.department.findMany({
      where: { headId: userId, organizationId: orgId }
    });
    const deptIds = depts.map(d => d.id);

    return prisma.user.findMany({
      where: {
        OR: [
          { managerId: userId },
          { departmentId: { in: deptIds } }
        ],
        organizationId: orgId,
        isDeleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        attendances: {
          where: { date: today }
        }
      }
    });
  }

  static async getExceptionsList(orgId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const records = await getAttendanceExceptions(orgId, limit, skip);

    const where: any = {
      user: { organizationId: orgId },
      OR: [
        { checkOut: null },
        { status: "LATE" },
        { isManualEntry: true }
      ]
    };
    const total = await prisma.attendance.count({ where });

    return { records, total };
  }

  static async adjust(
    orgId: string,
    attendanceId: string,
    fields: { checkIn?: Date; checkOut?: Date; status?: AttendanceStatus; notes: string },
    requestedBy: string,
    req?: any
  ) {
    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });

    if (!existing) {
      throw AppError.notFound("Attendance record not found");
    }

    const requester = await prisma.user.findUnique({
      where: { id: requestedBy },
      select: { systemRole: true }
    });

    const isOrgAdmin = requester?.systemRole === "ORG_ADMIN" || requester?.systemRole === "SYS_OWNER" || requester?.systemRole === "SUPER_ADMIN";

    const request = await prisma.attendanceAdjustmentRequest.create({
      data: {
        attendanceId,
        requestedBy,
        reason: fields.notes,
        proposedCheckIn: fields.checkIn ? new Date(fields.checkIn) : null,
        proposedCheckOut: fields.checkOut ? new Date(fields.checkOut) : null,
        proposedStatus: fields.status || null,
        status: isOrgAdmin ? "APPROVED" : "PENDING",
        approvedBy: isOrgAdmin ? requestedBy : null
      }
    });

    if (isOrgAdmin) {
      const updateData: any = {};
      if (fields.checkIn) updateData.checkIn = new Date(fields.checkIn);
      if (fields.checkOut) updateData.checkOut = new Date(fields.checkOut);
      if (fields.status) updateData.status = fields.status;
      updateData.isManualEntry = true;

      await prisma.attendance.update({
        where: { id: attendanceId },
        data: updateData
      });
    }

    await AuditService.log({
      organizationId: orgId,
      actorId: requestedBy,
      action: AuditAction.CREATED,
      module: "attendance",
      targetId: request.id,
      targetType: "AttendanceAdjustmentRequest",
      newValue: request,
      req
    });

    return request;
  }

  static async listAdjustmentRequests(orgId: string, status?: any) {
    return prisma.attendanceAdjustmentRequest.findMany({
      where: {
        attendance: {
          user: { organizationId: orgId }
        },
        ...(status ? { status } : {})
      },
      include: {
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async approveAdjustment(orgId: string, requestId: string, approverId: string, req?: any) {
    const request = await prisma.attendanceAdjustmentRequest.findUnique({
      where: { id: requestId },
      include: {
        attendance: {
          include: { breaks: true }
        }
      }
    });

    if (!request) {
      throw AppError.notFound("Adjustment request not found");
    }

    if (request.status !== "PENDING") {
      throw AppError.badRequest("Adjustment request is already resolved");
    }

    const approver = await prisma.user.findUnique({ where: { id: approverId }, select: { systemRole: true } });
    const isOrgAdmin = approver?.systemRole === "ORG_ADMIN" || approver?.systemRole === "SUPER_ADMIN" || approver?.systemRole === "SYS_OWNER";

    if (request.requestedBy === approverId && !isOrgAdmin) {
      throw AppError.forbidden("Two-person rule violation: You cannot approve your own adjustment request");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Calculate total hours
      let totalHours = request.attendance.totalHours;
      const checkInTime = request.proposedCheckIn || request.attendance.checkIn;
      const checkOutTime = request.proposedCheckOut || request.attendance.checkOut;

      if (checkInTime && checkOutTime) {
        let calcHours = (new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / (1000 * 60 * 60);
        let totalBreakMs = 0;
        for (const b of request.attendance.breaks) {
          const end = b.breakEnd || new Date();
          totalBreakMs += (end.getTime() - b.breakStart.getTime());
        }
        const breakHours = totalBreakMs / (1000 * 60 * 60);
        calcHours = Math.max(0, calcHours - breakHours);
        totalHours = Math.round(calcHours * 100) / 100;
      }

      // Update request status
      const updatedRequest = await tx.attendanceAdjustmentRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", approvedBy: approverId }
      });

      // Update attendance record
      const updatedAttendance = await tx.attendance.update({
        where: { id: request.attendanceId },
        data: {
          checkIn: request.proposedCheckIn || undefined,
          checkOut: request.proposedCheckOut || undefined,
          status: request.proposedStatus || undefined,
          notes: request.reason,
          isManualEntry: true,
          adjustedBy: request.requestedBy,
          totalHours
        }
      });

      return { updatedRequest, updatedAttendance };
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.APPROVED,
      module: "attendance",
      targetId: request.attendanceId,
      targetType: "Attendance",
      oldValue: request.attendance,
      newValue: result.updatedAttendance,
      req
    });

    return result;
  }

  static async rejectAdjustment(orgId: string, requestId: string, approverId: string, req?: any) {
    const request = await prisma.attendanceAdjustmentRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw AppError.notFound("Adjustment request not found");
    }

    if (request.status !== "PENDING") {
      throw AppError.badRequest("Adjustment request is already resolved");
    }

    const updatedRequest = await prisma.attendanceAdjustmentRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", approvedBy: approverId }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: approverId,
      action: AuditAction.REJECTED,
      module: "attendance",
      targetId: request.attendanceId,
      targetType: "AttendanceAdjustmentRequest",
      oldValue: request,
      newValue: updatedRequest,
      req
    });

    return updatedRequest;
  }

  static async getSummaryStats(userId: string, month: number, year: number) {
    return getAttendanceSummary(userId, month, year);
  }

  static async listShifts(orgId: string) {
    return prisma.shiftConfig.findMany({
      where: { organizationId: orgId, isDeleted: false },
      orderBy: { name: "asc" }
    });
  }
}
