import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { prisma } from "../config/database";
import { AppError } from "../utils/errors.util";

export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.org) {
        throw AppError.unauthorized("Authentication required");
      }

      if (req.user.systemRole === "SUPER_ADMIN" || req.user.systemRole === "ORG_ADMIN") {
        return next();
      }

      const orgId = req.org.id;
      const roles = req.user.roles || [];

      if (roles.length === 0) {
        throw AppError.forbidden("No roles assigned to user");
      }

      let hasPermission = false;
      const allPermissions: Array<{ resource: string; action: string }> = [];

      for (const userRole of roles) {
        const cacheKey = `permissions:${orgId}:${userRole.roleId}`;
        const cachedPerms = await redis.get(cacheKey);
        let perms: Array<{ resource: string; action: string }> = [];

        if (cachedPerms) {
          perms = JSON.parse(cachedPerms);
        } else {
          const dbPerms = await prisma.rolePermission.findMany({
            where: {
              roleId: userRole.roleId,
              organizationId: orgId
            },
            select: {
              resource: true,
              action: true
            }
          });
          perms = dbPerms;
          await redis.setex(cacheKey, 300, JSON.stringify(perms));
        }

        allPermissions.push(...perms);

        const match = perms.some((p) => p.resource === resource && p.action === action);
        if (match) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        throw AppError.forbidden("Access denied: insufficient permissions");
      }

      req.permissions = allPermissions;
      next();
    } catch (error) {
      next(error);
    }
  };
}
