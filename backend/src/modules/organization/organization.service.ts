import { prisma } from "../../config/database";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@prisma/client";

export class OrganizationService {
  static async getById(id: string) {
    return prisma.organization.findUnique({
      where: { id }
    });
  }

  static async getBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug }
    });
  }

  static async updateFeatures(id: string, enabledFeatures: string[], actorId: string, req?: any) {
    const org = await prisma.organization.findUnique({
      where: { id }
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { enabledFeatures }
    });

    await AuditService.log({
      organizationId: id,
      actorId,
      action: AuditAction.UPDATED,
      module: "organization",
      targetId: id,
      targetType: "Organization",
      oldValue: { enabledFeatures: org.enabledFeatures },
      newValue: { enabledFeatures },
      req
    });

    return updated;
  }

  static async updateLocation(
    id: string,
    data: { officeLatitude: number | null; officeLongitude: number | null; officeRadius: number | null },
    actorId: string,
    req?: any
  ) {
    const org = await prisma.organization.findUnique({
      where: { id }
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        officeLatitude: data.officeLatitude,
        officeLongitude: data.officeLongitude,
        officeRadius: data.officeRadius
      }
    });

    await AuditService.log({
      organizationId: id,
      actorId,
      action: AuditAction.UPDATED,
      module: "organization",
      targetId: id,
      targetType: "Organization",
      oldValue: {
        officeLatitude: org.officeLatitude,
        officeLongitude: org.officeLongitude,
        officeRadius: org.officeRadius
      },
      newValue: data,
      req
    });

    return updated;
  }

  static async verifyUpi(id: string, utr: string, tier: any, actorId: string, req?: any) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: { users: true }
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Update org subscription status
    const updated = await prisma.organization.update({
      where: { id },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionTier: tier,
        paymentRef: utr,
        isSetupComplete: false // Force them to complete onboarding now that they paid
      }
    });

    // Clear trial demo data if it was a trial organization
    if (org.name.includes("(Trial)") || org.slug.includes("-trial-")) {
      const usersToDelete = org.users.filter(u => u.id !== actorId);
      const userIdsToDelete = usersToDelete.map(u => u.id);

      if (userIdsToDelete.length > 0) {
        await prisma.attendance.deleteMany({ where: { userId: { in: userIdsToDelete } } });
        await prisma.leaveRequest.deleteMany({ where: { userId: { in: userIdsToDelete } } });
        await prisma.leaveBalance.deleteMany({ where: { userId: { in: userIdsToDelete } } });
        await prisma.userRole.deleteMany({ where: { userId: { in: userIdsToDelete } } });
        await prisma.refreshToken.deleteMany({ where: { userId: { in: userIdsToDelete } } });
        await prisma.task.deleteMany({ where: { assigneeId: { in: userIdsToDelete } } });
        await prisma.user.deleteMany({ where: { id: { in: userIdsToDelete } } });
      }

      await prisma.task.deleteMany({ where: { orgId: id } });
      await prisma.department.deleteMany({ where: { organizationId: id } });

      const cleanName = org.name.replace(" (Trial)", "");
      await prisma.organization.update({
        where: { id },
        data: { name: cleanName }
      });
    }

    await AuditService.log({
      organizationId: id,
      actorId,
      action: AuditAction.UPDATED,
      module: "payments",
      targetId: id,
      targetType: "Organization",
      newValue: { subscriptionStatus: "ACTIVE", subscriptionTier: tier, paymentRef: utr },
      req
    });

    return updated;
  }
}
