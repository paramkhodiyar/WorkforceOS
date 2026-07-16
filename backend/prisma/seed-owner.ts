import { PrismaClient, SystemRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "paramkhodiyar1008@gmail.com";
  const password = "Param@1008";
  const passwordHash = await bcrypt.hash(password, 10);

  // Find the first organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found. Please run seed script first.");
    return;
  }

  // Check if SYS_OWNER already exists
  const existingOwner = await prisma.user.findFirst({
    where: { systemRole: SystemRole.SYS_OWNER }
  });

  if (existingOwner) {
    if (existingOwner.email !== email) {
      console.error("A SYS_OWNER already exists with a different email. Only one can exist.");
      return;
    }
    // Update password and organization link just in case
    await prisma.user.update({
      where: { id: existingOwner.id },
      data: {
        passwordHash,
        organizationId: org.id
      }
    });
    console.log("SYS_OWNER updated successfully.");
  } else {
    // Create new SYS_OWNER
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: "Param",
        lastName: "Owner",
        systemRole: SystemRole.SYS_OWNER,
        organizationId: org.id,
        status: UserStatus.ACTIVE,
        employeeId: "OWNER-001",
        forcePasswordChange: false
      }
    });
    console.log("SYS_OWNER created successfully with ID:", newUser.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
