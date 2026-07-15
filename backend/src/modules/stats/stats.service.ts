import { prisma } from "../../config/database";

export class StatsService {
  static async getOperationsStats(orgId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      lateAttendanceCount,
      totalAttendanceDays,
      pendingLeaveRequests,
      totalLeaveRequests,
      lateTaskCount,
      totalClosedTasks,
      totalShifts,
      todayAttendance,
      overdueTasksCount,
      blockedTasksCount,
      totalTasks
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId, isDeleted: false } }),
      prisma.user.count({ where: { organizationId: orgId, isDeleted: false, status: "ACTIVE" } }),
      prisma.attendance.count({
        where: {
          user: { organizationId: orgId },
          status: "LATE",
          date: { gte: thirtyDaysAgo }
        }
      }),
      prisma.attendance.count({
        where: {
          user: { organizationId: orgId },
          date: { gte: thirtyDaysAgo },
          checkIn: { not: null }
        }
      }),
      prisma.leaveRequest.count({
        where: { user: { organizationId: orgId }, status: "PENDING" }
      }),
      prisma.leaveRequest.count({
        where: { user: { organizationId: orgId }, createdAt: { gte: thirtyDaysAgo } }
      }),
      // Tasks submitted late: submitted after dueDate
      prisma.task.count({
        where: {
          orgId,
          status: { in: ["SUBMITTED", "IN_REVIEW", "CHANGES_REQUESTED", "RESUBMITTED", "APPROVED", "CLOSED"] },
          dueDate: { not: null },
          updatedAt: { gte: ninetyDaysAgo }
        }
      }),
      prisma.task.count({
        where: {
          orgId,
          status: { in: ["CLOSED", "APPROVED"] },
          dueDate: { not: null }
        }
      }),
      prisma.shiftConfig.count({ where: { organizationId: orgId, isDeleted: false } }),
      prisma.attendance.findMany({
        where: { user: { organizationId: orgId }, date: today, checkIn: { not: null } },
        select: { checkIn: true }
      }),
      prisma.task.count({
        where: {
          orgId,
          dueDate: { lt: now },
          status: { notIn: ["CLOSED", "APPROVED"] }
        }
      }),
      prisma.task.count({ where: { orgId, isBlocked: true, status: { notIn: ["CLOSED"] } } }),
      prisma.task.count({ where: { orgId } })
    ]);

    // Compute today's average check-in time
    let avgCheckInTime = "N/A";
    if (todayAttendance.length > 0) {
      const totalMinutes = todayAttendance.reduce((sum: number, r: any) => {
        const d = new Date(r.checkIn);
        return sum + d.getHours() * 60 + d.getMinutes();
      }, 0);
      const avgMins = Math.round(totalMinutes / todayAttendance.length);
      const h = Math.floor(avgMins / 60).toString().padStart(2, "0");
      const m = (avgMins % 60).toString().padStart(2, "0");
      avgCheckInTime = `${h}:${m}`;
    }

    // Late attendance rate
    const lateRate = totalAttendanceDays > 0
      ? parseFloat(((lateAttendanceCount / totalAttendanceDays) * 100).toFixed(1))
      : 0;

    // Leave pending rate
    const leavePendingRate = totalLeaveRequests > 0
      ? parseFloat(((pendingLeaveRequests / totalLeaveRequests) * 100).toFixed(1))
      : 0;

    // Get department-wise stats
    const departments = await prisma.department.findMany({
      where: { organizationId: orgId, isDeleted: false },
      select: {
        id: true,
        name: true
      }
    });

    // Get member counts per department
    const deptMemberCounts = await prisma.user.groupBy({
      by: ["departmentId"],
      where: { organizationId: orgId, isDeleted: false, departmentId: { not: null } },
      _count: { departmentId: true }
    });

    // Get top late employees (last 30 days)
    const lateEmployees = await prisma.attendance.groupBy({
      by: ["userId"],
      where: {
        user: { organizationId: orgId },
        status: "LATE",
        date: { gte: thirtyDaysAgo }
      },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5
    });

    const lateEmployeeDetails = await Promise.all(
      lateEmployees.map(async (le) => {
        const u = await prisma.user.findUnique({
          where: { id: le.userId },
          select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true, department: { select: { name: true } } }
        });
        return { ...u, lateCount: le._count.userId };
      })
    );

    // Get high leave frequency employees (last 30 days)
    const leaveFrequency = await prisma.leaveRequest.groupBy({
      by: ["userId"],
      where: {
        user: { organizationId: orgId },
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5
    });

    const leaveFrequencyDetails = await Promise.all(
      leaveFrequency.map(async (lf) => {
        const u = await prisma.user.findUnique({
          where: { id: lf.userId },
          select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true, department: { select: { name: true } } }
        });
        return { ...u, leaveCount: lf._count.userId };
      })
    );

    return {
      overview: {
        totalEmployees,
        activeEmployees,
        lateRate,
        avgCheckInTime,
        todayCheckedIn: todayAttendance.length,
        pendingLeaveRequests,
        leavePendingRate,
        totalShifts,
        overdueTasksCount,
        blockedTasksCount,
        totalTasks,
        lateTaskCount
      },
      departments: departments.map(d => ({
        id: d.id,
        name: d.name,
        memberCount: deptMemberCounts.find(c => c.departmentId === d.id)?._count?.departmentId || 0
      })),
      lateEmployees: lateEmployeeDetails,
      leaveFrequencyEmployees: leaveFrequencyDetails
    };
  }

  static async getEmployeeStats(userId: string, orgId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, designation: true, avatarUrl: true,
        department: { select: { name: true } }, joinDate: true
      }
    });
    if (!user) return null;

    const [
      lateCount,
      totalDays,
      pendingLeave,
      totalLeave,
      assignedTasks,
      completedTasks,
      overdueTasks
    ] = await Promise.all([
      prisma.attendance.count({
        where: { userId, status: "LATE", date: { gte: thirtyDaysAgo } }
      }),
      prisma.attendance.count({
        where: { userId, date: { gte: thirtyDaysAgo }, checkIn: { not: null } }
      }),
      prisma.leaveRequest.count({ where: { userId, status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.task.count({ where: { assigneeId: userId, status: { notIn: ["CLOSED", "APPROVED"] } } }),
      prisma.task.count({ where: { assigneeId: userId, status: { in: ["CLOSED", "APPROVED"] } } }),
      prisma.task.count({
        where: { assigneeId: userId, dueDate: { lt: now }, status: { notIn: ["CLOSED", "APPROVED"] } }
      })
    ]);

    return {
      user,
      lateCount,
      attendanceRate: totalDays > 0 ? parseFloat((((totalDays - lateCount) / totalDays) * 100).toFixed(1)) : 100,
      pendingLeave,
      totalLeave,
      assignedTasks,
      completedTasks,
      overdueTasks
    };
  }
}
