import { prisma } from "../../config/database";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@prisma/client";
import { AppError } from "../../utils/errors.util";

export class OrgSettingsService {
  static async get(organizationId: string) {
    let settings = await prisma.orgSettings.findUnique({
      where: { organizationId }
    });

    if (!settings) {
      // Auto-create with defaults on first access
      settings = await prisma.orgSettings.create({
        data: { organizationId }
      });
    }

    return settings;
  }

  static async update(
    organizationId: string,
    data: {
      officeLatitude?: number | null;
      officeLongitude?: number | null;
      officeRadius?: number | null;
      officeName?: string | null;
      workStartTime?: string;
      workEndTime?: string;
      totalWorkHours?: number;
      gracePeriodMinutes?: number;
      hraPercent?: number;
      pfPercent?: number;
      specialAllowPercent?: number;
      lopDeductionEnabled?: boolean;
    },
    actorId: string,
    req?: any
  ) {
    const existing = await this.get(organizationId);

    const updated = await prisma.orgSettings.update({
      where: { organizationId },
      data
    });

    await AuditService.log({
      organizationId,
      actorId,
      action: AuditAction.UPDATED,
      module: "settings",
      targetId: updated.id,
      targetType: "OrgSettings",
      oldValue: existing,
      newValue: data,
      req
    });

    return updated;
  }
}
