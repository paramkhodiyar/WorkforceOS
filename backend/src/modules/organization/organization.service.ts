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
}
