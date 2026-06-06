import { prisma } from "../../config/database";
import { calculateWorkingDays } from "../../utils/date.util";

export async function aggregatePerformanceMetrics(userId: string, startDate: Date, endDate: Date) {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      createdAt: { gte: startDate, lte: endDate },
      isDeleted: false
    },
    include: {
      reviews: true
    }
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "CLOSED" || t.status === "APPROVED");
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 100;

  let scoreSum = 0;
  let scoreCount = 0;
  let reworkCount = 0;

  for (const t of tasks) {
    for (const r of t.reviews) {
      if (r.score) {
        scoreSum += r.score;
        scoreCount++;
      }
      if (r.action === "CHANGES_REQUESTED") {
        reworkCount++;
      }
    }
  }

  const avgScore = scoreCount > 0 ? scoreSum / scoreCount : 5.0;

  const completedWithDueDate = completedTasks.filter((t) => t.dueDate !== null);
  const metDeadlines = completedWithDueDate.filter((t) => t.dueDate && t.updatedAt <= t.dueDate);
  const deadlinesMet = completedWithDueDate.length > 0 ? (metDeadlines.length / completedWithDueDate.length) * 100 : 100;

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      isDeleted: false
    }
  });

  let attendedDays = 0;
  for (const att of attendanceRecords) {
    if (att.status === "PRESENT" || att.status === "LATE") {
      attendedDays += 1;
    } else if (att.status === "HALF_DAY") {
      attendedDays += 0.5;
    }
  }

  const workingDays = calculateWorkingDays(startDate, endDate) || 1;
  const attendancePct = Math.min((attendedDays / workingDays) * 100, 100);

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    score: Math.round(avgScore * 100) / 100,
    deadlinesMet: Math.round(deadlinesMet * 100) / 100,
    reworkCount,
    attendancePct: Math.round(attendancePct * 100) / 100
  };
}
