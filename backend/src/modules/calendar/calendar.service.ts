import { prisma } from "../../config/database";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { AuditAction, NotificationType, AttendeeStatus, RecurrenceType } from "@prisma/client";

interface UserAvailability {
  userId: string;
  name: string;
  email: string;
  isAvailable: boolean;
  conflicts: Array<{
    type: "meeting" | "leave";
    title: string;
    startTime: Date;
    endTime: Date;
  }>;
}

export class CalendarService {
  static async listEvents(userId: string, orgId: string, startDate: Date, endDate: Date) {
    // 1. Fetch one-off and recurring master events
    const masterEvents = await prisma.calendarEvent.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false,
        OR: [
          { creatorId: userId },
          { attendees: { some: { userId } } }
        ]
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } },
        attendees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, designation: true } }
          }
        },
        exceptions: true
      }
    });

    const allEvents: any[] = [];

    for (const event of masterEvents) {
      if (event.recurrenceType === "NONE") {
        // One-off event: check if overlaps with query range
        if (event.startTime <= endDate && event.endTime >= startDate) {
          allEvents.push(event);
        }
      } else {
        // Recurring event: expand occurrences in range
        const expanded = expandEvent(event, startDate, endDate, event.exceptions);
        allEvents.push(...expanded);
      }
    }

    // 2. Fetch approved leaves for this user within range
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        userId,
        status: "HR_APPROVED",
        isDeleted: false,
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      }
    });

    // Map leaves to mock all-day events
    const leaveEvents = leaves.map(leave => {
      // Make start/end time of leave cover the full day in local time
      const sDate = new Date(leave.startDate);
      sDate.setUTCHours(0, 0, 0, 0);
      const eDate = new Date(leave.endDate);
      eDate.setUTCHours(23, 59, 59, 999);

      return {
        id: `leave_${leave.id}`,
        title: `On Leave (${leave.leaveType})`,
        description: leave.reason,
        location: "Out of Office",
        startTime: sDate,
        endTime: eDate,
        isAllDay: true,
        isLeave: true,
        creator: null,
        attendees: [],
        recurrenceType: "NONE"
      };
    });

    return [...allEvents, ...leaveEvents].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  static async createEvent(
    orgId: string,
    creatorId: string,
    data: {
      title: string;
      description?: string;
      location?: string;
      startTime: string;
      endTime: string;
      isAllDay?: boolean;
      meetingLink?: string;
      recurrenceType?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
      recurrenceInterval?: number;
      recurrenceDays?: string;
      recurrenceEndDate?: string;
      inviteeIds?: string[];
    },
    req?: any
  ) {
    const startTimeDate = new Date(data.startTime);
    const endTimeDate = new Date(data.endTime);
    const recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null;

    // Check availability of invitees and creator (optional warning or error)
    // We log it and continue but we also include attendee mappings
    const event = await prisma.calendarEvent.create({
      data: {
        organizationId: orgId,
        creatorId,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        startTime: startTimeDate,
        endTime: endTimeDate,
        isAllDay: data.isAllDay ?? false,
        meetingLink: data.meetingLink ?? null,
        recurrenceType: data.recurrenceType ?? "NONE",
        recurrenceInterval: data.recurrenceInterval ?? 1,
        recurrenceDays: data.recurrenceDays ?? null,
        recurrenceEndDate,
        attendees: {
          create: [
            // Auto-accept the creator
            { userId: creatorId, status: "ACCEPTED" },
            // Add other invitees as pending
            ...(data.inviteeIds ?? [])
              .filter(id => id !== creatorId)
              .map(id => ({ userId: id, status: "PENDING" as AttendeeStatus }))
          ]
        }
      },
      include: {
        attendees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: creatorId,
      action: AuditAction.CREATED,
      module: "calendar",
      targetId: event.id,
      targetType: "CalendarEvent",
      req
    });

    // Notify all invitees
    if (data.inviteeIds && data.inviteeIds.length > 0) {
      const creator = await prisma.user.findUnique({ where: { id: creatorId } });
      const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : "Someone";
      
      for (const inviteeId of data.inviteeIds) {
        if (inviteeId === creatorId) continue;
        await NotificationService.notify(
          inviteeId,
          NotificationType.SYSTEM,
          "New Meeting Invitation",
          `${creatorName} invited you to "${data.title}" scheduled for ${startTimeDate.toLocaleString()}`,
          { eventId: event.id }
        );
      }
    }

    return event;
  }

  static async updateEvent(
    id: string,
    orgId: string,
    actorId: string,
    data: Partial<{
      title: string;
      description: string | null;
      location: string | null;
      startTime: string;
      endTime: string;
      isAllDay: boolean;
      meetingLink: string | null;
      recurrenceType: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
      recurrenceInterval: number;
      recurrenceDays: string | null;
      recurrenceEndDate: string | null;
      inviteeIds: string[];
    }>,
    req?: any
  ) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: { attendees: true }
    });

    if (!event) throw AppError.notFound("Calendar event not found");
    if (event.creatorId !== actorId) {
      throw AppError.forbidden("Only the organizer can edit this event");
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.recurrenceType !== undefined) updateData.recurrenceType = data.recurrenceType;
    if (data.recurrenceInterval !== undefined) updateData.recurrenceInterval = data.recurrenceInterval;
    if (data.recurrenceDays !== undefined) updateData.recurrenceDays = data.recurrenceDays;
    if (data.recurrenceEndDate !== undefined) {
      updateData.recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null;
    }

    // Handle invitee updates
    if (data.inviteeIds !== undefined) {
      const currentAttendeeIds = event.attendees.map(a => a.userId);
      const newInviteeIds = data.inviteeIds;

      const toAdd = newInviteeIds.filter(id => !currentAttendeeIds.includes(id));
      const toRemove = currentAttendeeIds.filter(id => !newInviteeIds.includes(id) && id !== event.creatorId);

      // Remove attendees
      if (toRemove.length > 0) {
        await prisma.eventAttendee.deleteMany({
          where: {
            eventId: id,
            userId: { in: toRemove }
          }
        });
      }

      // Add attendees
      if (toAdd.length > 0) {
        await prisma.eventAttendee.createMany({
          data: toAdd.map(userId => ({
            eventId: id,
            userId,
            status: "PENDING"
          }))
        });
      }

      // Notify newly added invitees
      const creator = await prisma.user.findUnique({ where: { id: actorId } });
      const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : "Someone";
      const sTime = updateData.startTime ?? event.startTime;

      for (const inviteeId of toAdd) {
        await NotificationService.notify(
          inviteeId,
          NotificationType.SYSTEM,
          "New Meeting Invitation",
          `${creatorName} invited you to "${data.title ?? event.title}" scheduled for ${sTime.toLocaleString()}`,
          { eventId: id }
        );
      }
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        attendees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "calendar",
      targetId: id,
      targetType: "CalendarEvent",
      oldValue: event,
      newValue: updated,
      req
    });

    return updated;
  }

  static async deleteEvent(id: string, orgId: string, actorId: string, req?: any) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: { attendees: true }
    });

    if (!event) throw AppError.notFound("Calendar event not found");
    if (event.creatorId !== actorId) {
      throw AppError.forbidden("Only the organizer can delete this event");
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.DELETED,
      module: "calendar",
      targetId: id,
      targetType: "CalendarEvent",
      req
    });

    // Notify invitees
    const creator = await prisma.user.findUnique({ where: { id: actorId } });
    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : "Someone";

    for (const attendee of event.attendees) {
      if (attendee.userId === actorId) continue;
      await NotificationService.notify(
        attendee.userId,
        NotificationType.SYSTEM,
        "Meeting Cancelled",
        `${creatorName} cancelled the meeting "${event.title}"`,
        { eventId: id }
      );
    }

    return updated;
  }

  static async deleteInstance(id: string, orgId: string, actorId: string, dateStr: string, req?: any) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: { attendees: true }
    });

    if (!event) throw AppError.notFound("Calendar event not found");
    if (event.creatorId !== actorId) {
      throw AppError.forbidden("Only the organizer can cancel instances");
    }

    const exceptionDate = new Date(dateStr);
    exceptionDate.setUTCHours(0, 0, 0, 0); // normalize date

    // Register exception
    const exception = await prisma.recurrenceException.create({
      data: {
        eventId: id,
        exceptionDate,
        isCancelled: true
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "calendar",
      targetId: id,
      targetType: "CalendarEvent",
      newValue: { exceptionDate, isCancelled: true },
      req
    });

    // Notify invitees
    const creator = await prisma.user.findUnique({ where: { id: actorId } });
    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : "Someone";

    for (const attendee of event.attendees) {
      if (attendee.userId === actorId) continue;
      await NotificationService.notify(
        attendee.userId,
        NotificationType.SYSTEM,
        "Meeting Occurrence Cancelled",
        `${creatorName} cancelled the meeting occurrence of "${event.title}" on ${exceptionDate.toLocaleDateString()}`,
        { eventId: id, date: dateStr }
      );
    }

    return exception;
  }

  static async respondEvent(id: string, userId: string, orgId: string, status: "ACCEPTED" | "DECLINED" | "TENTATIVE", req?: any) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!event) throw AppError.notFound("Calendar event not found");

    const attendee = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId } }
    });

    if (!attendee) {
      throw AppError.forbidden("You are not invited to this meeting");
    }

    const updated = await prisma.eventAttendee.update({
      where: { id: attendee.id },
      data: { status }
    });

    // Notify creator
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userName = user ? `${user.firstName} ${user.lastName}` : "Someone";

    await NotificationService.notify(
      event.creatorId,
      NotificationType.SYSTEM,
      "RSVP Response",
      `${userName} responded "${status}" to your meeting "${event.title}"`,
      { eventId: id, attendeeId: userId, response: status }
    );

    return updated;
  }

  static async checkAvailability(
    orgId: string,
    inviteeIds: string[],
    startTime: Date,
    endTime: Date
  ): Promise<UserAvailability[]> {
    const availabilities: UserAvailability[] = [];

    for (const userId of inviteeIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId, organizationId: orgId, isDeleted: false },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      if (!user) continue;

      const conflicts: UserAvailability["conflicts"] = [];

      // 1. Fetch leaves in range
      const leaves = await prisma.leaveRequest.findMany({
        where: {
          userId,
          status: "HR_APPROVED",
          isDeleted: false,
          startDate: { lte: endTime },
          endDate: { gte: startTime }
        }
      });

      for (const leave of leaves) {
        conflicts.push({
          type: "leave",
          title: `On Leave (${leave.leaveType})`,
          startTime: leave.startDate,
          endTime: leave.endDate
        });
      }

      // 2. Fetch master events for user
      const masterEvents = await prisma.calendarEvent.findMany({
        where: {
          organizationId: orgId,
          isDeleted: false,
          OR: [
            { creatorId: userId },
            { attendees: { some: { userId, status: { in: ["ACCEPTED", "PENDING", "TENTATIVE"] } } } }
          ]
        },
        include: { exceptions: true }
      });

      for (const event of masterEvents) {
        if (event.recurrenceType === "NONE") {
          // Check overlap
          if (event.startTime < endTime && event.endTime > startTime) {
            conflicts.push({
              type: "meeting",
              title: event.title,
              startTime: event.startTime,
              endTime: event.endTime
            });
          }
        } else {
          // Expand recurrence in target range
          const occurrences = expandEvent(event, startTime, endTime, event.exceptions);
          for (const occ of occurrences) {
            if (occ.startTime < endTime && occ.endTime > startTime) {
              conflicts.push({
                type: "meeting",
                title: event.title,
                startTime: occ.startTime,
                endTime: occ.endTime
              });
            }
          }
        }
      }

      availabilities.push({
        userId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isAvailable: conflicts.length === 0,
        conflicts
      });
    }

    return availabilities;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS FOR RECURRENCE EXPANSION
// ─────────────────────────────────────────────────────────────────────────────

function expandEvent(event: any, rangeStart: Date, rangeEnd: Date, exceptions: any[]): any[] {
  const occurrences: any[] = [];
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const durationMs = end.getTime() - start.getTime();

  const queryStart = rangeStart.getTime();
  const queryEnd = rangeEnd.getTime();
  const limitDate = event.recurrenceEndDate ? new Date(event.recurrenceEndDate).getTime() : queryEnd;
  const loopEnd = Math.min(queryEnd, limitDate);

  const exceptionDates = new Set(
    exceptions.map(e => {
      const d = new Date(e.exceptionDate);
      d.setUTCHours(0, 0, 0, 0);
      return d.toDateString();
    })
  );

  let current = new Date(start);

  if (event.recurrenceType === "DAILY") {
    while (current.getTime() <= loopEnd) {
      current.setUTCHours(start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds());
      if (current.getTime() >= start.getTime()) {
        const checkDate = new Date(current);
        checkDate.setUTCHours(0, 0, 0, 0);

        if (current.getTime() + durationMs >= queryStart && current.getTime() <= queryEnd) {
          if (!exceptionDates.has(checkDate.toDateString())) {
            const occStart = new Date(current);
            const occEnd = new Date(current.getTime() + durationMs);
            occurrences.push(createInstance(event, occStart, occEnd));
          }
        }
      }
      current.setDate(current.getDate() + event.recurrenceInterval);
    }
  } else if (event.recurrenceType === "WEEKLY") {
    const targetDays = event.recurrenceDays
      ? event.recurrenceDays.split(",").map((d: string) => d.trim().toUpperCase())
      : [getDayOfWeekString(start.getDay())];

    // Align start to beginning of the week
    const startOfWeek = new Date(start);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    let weekCurrent = new Date(startOfWeek);

    while (weekCurrent.getTime() <= loopEnd) {
      for (const dayStr of targetDays) {
        const targetDayNum = getDayOfWeekNumber(dayStr);
        const instanceDate = new Date(weekCurrent);
        instanceDate.setDate(instanceDate.getDate() + targetDayNum);
        instanceDate.setUTCHours(start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds());

        if (instanceDate.getTime() >= start.getTime() && instanceDate.getTime() <= loopEnd) {
          const checkDate = new Date(instanceDate);
          checkDate.setUTCHours(0, 0, 0, 0);

          if (instanceDate.getTime() + durationMs >= queryStart && instanceDate.getTime() <= queryEnd) {
            if (!exceptionDates.has(checkDate.toDateString())) {
              const occStart = new Date(instanceDate);
              const occEnd = new Date(instanceDate.getTime() + durationMs);
              occurrences.push(createInstance(event, occStart, occEnd));
            }
          }
        }
      }
      weekCurrent.setDate(weekCurrent.getDate() + 7 * event.recurrenceInterval);
    }
  } else if (event.recurrenceType === "MONTHLY") {
    while (current.getTime() <= loopEnd) {
      current.setUTCHours(start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds());
      if (current.getTime() >= start.getTime()) {
        const checkDate = new Date(current);
        checkDate.setUTCHours(0, 0, 0, 0);

        if (current.getTime() + durationMs >= queryStart && current.getTime() <= queryEnd) {
          if (!exceptionDates.has(checkDate.toDateString())) {
            const occStart = new Date(current);
            const occEnd = new Date(current.getTime() + durationMs);
            occurrences.push(createInstance(event, occStart, occEnd));
          }
        }
      }
      current.setMonth(current.getMonth() + event.recurrenceInterval);
    }
  }

  return occurrences;
}

function createInstance(event: any, startTime: Date, endTime: Date) {
  return {
    ...event,
    id: `${event.id}_${startTime.toISOString().split("T")[0]}`,
    masterEventId: event.id,
    startTime,
    endTime,
    isOccurrence: true
  };
}

function getDayOfWeekString(day: number): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[day];
}

function getDayOfWeekNumber(day: string): number {
  const days: Record<string, number> = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
  };
  return days[day] ?? 0;
}
