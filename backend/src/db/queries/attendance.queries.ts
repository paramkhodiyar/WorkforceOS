import { prisma } from "../../config/database";

export async function getAttendanceExceptions(orgId: string, limit: number, skip: number) {
  return prisma.$queryRaw<any[]>`
    SELECT a.*, u."firstName", u."lastName", u.email
    FROM "Attendance" a
    JOIN "User" u ON a."userId" = u.id
    WHERE u."organizationId" = ${orgId}
      AND (
        a."checkOut" IS NULL
        OR a.status = 'LATE'
        OR a."isManualEntry" = true
      )
      AND a."isDeleted" = false
    ORDER BY a.date DESC
    LIMIT ${limit} OFFSET ${skip}
  `;
}

export async function getAttendanceSummary(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const result = await prisma.$queryRaw<any[]>`
    SELECT
      COUNT(CASE WHEN status = 'PRESENT' THEN 1 END)::int as "presentCount",
      COUNT(CASE WHEN status = 'ABSENT' THEN 1 END)::int as "absentCount",
      COUNT(CASE WHEN status = 'LATE' THEN 1 END)::int as "lateCount",
      COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END)::int as "halfDayCount",
      COUNT(CASE WHEN status = 'ON_LEAVE' THEN 1 END)::int as "onLeaveCount",
      SUM(COALESCE("totalHours", 0))::float as "totalHours",
      AVG(CASE WHEN "totalHours" IS NOT NULL AND "totalHours" > 0 THEN "totalHours" END)::float as "avgDailyHours"
    FROM "Attendance"
    WHERE "userId" = ${userId}
      AND date >= ${startDate}
      AND date <= ${endDate}
      AND "isDeleted" = false
  `;

  return result[0] || {
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    onLeaveCount: 0,
    totalHours: 0,
    avgDailyHours: 0
  };
}
