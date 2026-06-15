import { prisma } from "../../config/database";
import { AuditAction } from "@prisma/client";
import { logger } from "../../config/logger";

export class AuditService {
  static async log(payload: {
    organizationId: string;
    actorId: string;
    action: AuditAction;
    module: string;
    targetId?: string;
    targetType?: string;
    oldValue?: any;
    newValue?: any;
    req?: any;
  }): Promise<void> {
    let ipAddress = null;
    let userAgent = null;

    if (payload.req) {
      ipAddress = payload.req.ip || payload.req.socket.remoteAddress || null;
      userAgent = payload.req.headers ? payload.req.headers["user-agent"] || null : null;
    }

    prisma.auditLog.create({
      data: {
        organizationId: payload.organizationId,
        actorId: payload.actorId,
        action: payload.action,
        module: payload.module,
        targetId: payload.targetId || null,
        targetType: payload.targetType || null,
        oldValue: payload.oldValue ? JSON.parse(JSON.stringify(payload.oldValue)) : null,
        newValue: payload.newValue ? JSON.parse(JSON.stringify(payload.newValue)) : null,
        ipAddress,
        userAgent
      }
    }).catch((err) => {
      logger.error("Background AuditLog Error: " + err.message);
    });
  }

  static async getLogs(filters: {
    organizationId: string;
    actorId?: string;
    module?: string;
    action?: AuditAction;
    targetId?: string;
    targetType?: string;
    fromDate?: Date;
    toDate?: Date;
    page: number;
    limit: number;
  }) {
    const where: any = {
      organizationId: filters.organizationId
    };

    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.targetType) where.targetType = filters.targetType;

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const total = await prisma.auditLog.count({ where });
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return { logs, total };
  }

  static async getLogById(id: string, orgId: string) {
    return prisma.auditLog.findFirst({
      where: { id, organizationId: orgId },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }
}
