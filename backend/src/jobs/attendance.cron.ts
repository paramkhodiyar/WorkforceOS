import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";
import { prisma } from "../config/database";
import { logger } from "../config/logger";
import { AttendanceStatus } from "@prisma/client";

const QUEUE_NAME = "attendance-cron";

export const attendanceQueue = new Queue(QUEUE_NAME, {
  connection: redis.options,
});

export async function setupAttendanceCron() {
  // Clear old repeatable jobs to avoid duplicates
  const repeatableJobs = await attendanceQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await attendanceQueue.removeRepeatableByKey(job.key);
  }

  // Every night at 11:59 PM IST (59 23 * * *)
  await attendanceQueue.add(
    "mark-absent-employees",
    {},
    {
      repeat: {
        pattern: "59 23 * * *",
        tz: "Asia/Kolkata",
      },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
  logger.info("Scheduler: Attendance absent cron repeatable job added (11:59 PM IST)");
}

export const attendanceWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name === "mark-absent-employees") {
      logger.info("Job started: Auto-marking absent employees");
      
      const todayStr = new Date().toISOString().split("T")[0];
      const today = new Date(todayStr);

      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Fetch active employees
      const employees = await prisma.user.findMany({
        where: {
          status: "ACTIVE",
          isDeleted: false,
          systemRole: {
            notIn: ["SUPER_ADMIN", "AUDITOR"]
          }
        }
      });

      let absentCount = 0;

      for (const employee of employees) {
        // 1. Skip if there is already an attendance record for today
        const existingRecord = await prisma.attendance.findUnique({
          where: {
            userId_date: {
              userId: employee.id,
              date: today,
            },
          },
        });

        if (existingRecord) {
          continue;
        }

        // 2. Skip if it's a weekend
        if (isWeekend) {
          continue;
        }

        // 3. Skip if it is an organization holiday
        const holiday = await prisma.holiday.findUnique({
          where: {
            organizationId_date: {
              organizationId: employee.organizationId,
              date: today,
            },
          },
        });

        if (holiday) {
          continue;
        }

        // 4. Skip if they are on approved leave
        const leave = await prisma.leaveRequest.findFirst({
          where: {
            userId: employee.id,
            status: "HR_APPROVED",
            startDate: { lte: today },
            endDate: { gte: today },
            isDeleted: false,
          },
        });

        if (leave) {
          continue;
        }

        // Create ABSENT attendance record
        await prisma.attendance.create({
          data: {
            userId: employee.id,
            date: today,
            status: AttendanceStatus.ABSENT,
            notes: "System Auto-Mark: Absent due to no check-in record",
          },
        });

        absentCount++;
      }

      logger.info(`Job completed: Marked ${absentCount} employees as ABSENT`);
    }
  },
  {
    connection: redis.options,
  }
);

attendanceWorker.on("completed", (job) => {
  logger.info(`Job ${job?.id} completed successfully`);
});

attendanceWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});
