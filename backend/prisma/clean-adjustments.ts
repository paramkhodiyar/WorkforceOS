import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function cleanAndSeedAdjustments() {
  console.log("Cleaning self-adjustments and seeding employee requests...");
  
  // 1. Delete all existing adjustment requests
  await prisma.attendanceAdjustmentRequest.deleteMany({});

  // 2. Find employees (not Org Owner)
  const employees = await prisma.user.findMany({
    where: { systemRole: "EMPLOYEE" },
    take: 3
  });

  if (employees.length === 0) {
    console.log("No employees found to create adjustment requests.");
    return;
  }

  for (const emp of employees) {
    // Find or create an attendance record for today
    let att = await prisma.attendance.findFirst({
      where: { userId: emp.id }
    });

    if (!att) {
      const org = await prisma.organization.findFirst();
      if (!org) continue;
      att = await prisma.attendance.create({
        data: {
          userId: emp.id,
          date: new Date(),
          status: "PRESENT",
          workMode: "WFO",
          checkIn: new Date(Date.now() - 8 * 3600 * 1000)
        }
      });
    }

    // Create a pending adjustment request for this employee
    await prisma.attendanceAdjustmentRequest.create({
      data: {
        attendanceId: att.id,
        requestedBy: emp.id,
        reason: `Requesting shift time adjustment for ${emp.firstName}: Checked in remotely due to client meeting.`,
        proposedCheckIn: new Date(Date.now() - 9 * 3600 * 1000),
        proposedCheckOut: new Date(Date.now() - 1 * 3600 * 1000),
        proposedStatus: "PRESENT",
        status: "PENDING"
      }
    });
  }

  console.log("Successfully seeded clean employee adjustment requests!");
}

cleanAndSeedAdjustments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
