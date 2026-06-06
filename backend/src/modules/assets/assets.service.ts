import { prisma } from "../../config/database";
import { AssetStatus, AuditAction, NotificationType } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";

export class AssetsService {
  static async listAssets(orgId: string, filters: { category?: string; status?: AssetStatus }) {
    const where: any = { organizationId: orgId, isDeleted: false };
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;

    return prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
  }

  static async createAsset(orgId: string, data: { name: string; category: string; serialNumber?: string }, actorId: string, req?: any) {
    if (data.serialNumber) {
      const existing = await prisma.asset.findUnique({
        where: { serialNumber: data.serialNumber }
      });
      if (existing && !existing.isDeleted) {
        throw AppError.conflict("Asset with this serial number already exists");
      }
    }

    const asset = await prisma.asset.create({
      data: {
        organizationId: orgId,
        name: data.name,
        category: data.category,
        serialNumber: data.serialNumber || null,
        status: AssetStatus.AVAILABLE
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.CREATED,
      module: "assets",
      targetId: asset.id,
      targetType: "Asset",
      req
    });

    return asset;
  }

  static async updateAsset(id: string, orgId: string, data: any, actorId: string, req?: any) {
    const asset = await prisma.asset.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!asset) {
      throw AppError.notFound("Asset not found");
    }

    const updated = await prisma.asset.update({
      where: { id },
      data
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "assets",
      targetId: id,
      targetType: "Asset",
      oldValue: asset,
      newValue: updated,
      req
    });

    return updated;
  }

  static async assignAsset(id: string, orgId: string, userId: string, notes: string | undefined, actorId: string, req?: any) {
    const asset = await prisma.asset.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!asset) {
      throw AppError.notFound("Asset not found");
    }

    if (asset.status !== AssetStatus.AVAILABLE) {
      throw AppError.badRequest("Asset is not available for assignment");
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId, isDeleted: false }
    });

    if (!user) {
      throw AppError.notFound("Employee not found");
    }

    await prisma.asset.update({
      where: { id },
      data: { status: AssetStatus.ASSIGNED }
    });

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId: id,
        userId,
        notes
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "assets",
      targetId: id,
      targetType: "Asset",
      newValue: { status: AssetStatus.ASSIGNED, assignedTo: userId },
      req
    });

    await NotificationService.notify(
      userId,
      NotificationType.ASSET_ASSIGNED,
      "Asset Assigned",
      `A new asset (${asset.name}) has been assigned to you.`,
      { assetId: id }
    );

    return assignment;
  }

  static async returnAsset(id: string, orgId: string, condition: "AVAILABLE" | "DAMAGED", actorId: string, req?: any) {
    const asset = await prisma.asset.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!asset) {
      throw AppError.notFound("Asset not found");
    }

    if (asset.status !== AssetStatus.ASSIGNED) {
      throw AppError.badRequest("Asset is not currently assigned");
    }

    const activeAssignment = await prisma.assetAssignment.findFirst({
      where: { assetId: id, isActive: true }
    });

    if (activeAssignment) {
      await prisma.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          isActive: false,
          returnedAt: new Date()
        }
      });
    }

    const newStatus = condition === "DAMAGED" ? AssetStatus.DAMAGED : AssetStatus.AVAILABLE;

    const updated = await prisma.asset.update({
      where: { id },
      data: { status: newStatus }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "assets",
      targetId: id,
      targetType: "Asset",
      newValue: { status: newStatus },
      req
    });

    if (activeAssignment) {
      await NotificationService.notify(
        activeAssignment.userId,
        NotificationType.ASSET_ASSIGNED,
        "Asset Return Processed",
        `Your return of asset (${asset.name}) has been processed. Condition: ${condition}`
      );
    }

    return updated;
  }

  static async getHistory(id: string, orgId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!asset) {
      throw AppError.notFound("Asset not found");
    }

    return prisma.assetAssignment.findMany({
      where: { assetId: id },
      orderBy: { assignedAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
  }

  static async getEmployeeAssets(userId: string, orgId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId, isDeleted: false }
    });

    if (!user) {
      throw AppError.notFound("Employee not found");
    }

    return prisma.assetAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        asset: true
      }
    });
  }
}
