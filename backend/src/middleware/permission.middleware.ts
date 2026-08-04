import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { AppError } from "../utils/errors.util";
import { logger } from "../config/logger";
import { prisma } from "../config/database";

export function requirePermission(resource: string, action: string | string[]) {
  const actions = Array.isArray(action) ? action : [action];
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      if (
        req.user.systemRole === "SYS_OWNER" ||
        req.user.systemRole === "SUPER_ADMIN" ||
        req.user.originalRole === "SYS_OWNER"
      ) {
        return next();
      }

      if (!req.org) {
        throw AppError.unauthorized("Organization context required");
      }

      if (req.user.systemRole === "ORG_ADMIN") {
        return next();
      }

      const orgId = req.org.id;
      const roles = req.user.roles || [];

      if (resource === "employee" && actions.includes("read") && req.params.id === req.user.id) {
        return next();
      }

      // Bypass read permissions on employees and team attendance for management roles
      if (
        (resource === "employee" && actions.includes("read")) ||
        (resource === "attendance" && actions.includes("read_team"))
      ) {
        if (
          req.user.systemRole === "HR" ||
          req.user.systemRole === "DEPARTMENT_HEAD" ||
          req.user.systemRole === "MANAGER" ||
          roles.some(
            (r: any) =>
              r.roleName === "DEPARTMENT_HEAD" ||
              r.roleName === "TEAM_MANAGER" ||
              r.roleName === "HR_MANAGER"
          )
        ) {
          return next();
        }

      // Check if user is a department head or team lead using data already
      // available on req.user (populated by auth middleware) — no extra DB calls.
      const userAny = req.user as any;
      const isLeader =
        (userAny.departmentHead && userAny.departmentHead.length > 0) ||
        (userAny.teamLead && userAny.teamLead.length > 0);
      if (isLeader) {
        return next();
      }
      }

      if (roles.length === 0) {
        throw AppError.forbidden("No roles assigned to user");
      }

      let hasPermission = false;
      const allPermissions: Array<{ resource: string; action: string }> = [];

      // Fetch all from redis in parallel
      const cachedPermsList = await Promise.all(
        roles.map((userRole) => redis.get(`permissions:${orgId}:${userRole.roleId}`))
      );

      const rolesToQueryFromDb: any[] = [];
      const cachedPermissionsMap: Record<string, Array<{ resource: string; action: string }>> = {};

      for (let i = 0; i < roles.length; i++) {
        const userRole = roles[i];
        const cached = cachedPermsList[i];
        if (cached) {
          cachedPermissionsMap[userRole.roleId] = JSON.parse(cached);
        } else {
          rolesToQueryFromDb.push(userRole);
        }
      }

      if (rolesToQueryFromDb.length > 0) {
        const roleIds = rolesToQueryFromDb.map((ur) => ur.roleId);
        const dbPerms = await prisma.rolePermission.findMany({
          where: {
            roleId: { in: roleIds },
            organizationId: orgId
          },
          select: {
            roleId: true,
            resource: true,
            action: true
          }
        });

        // Group dbPerms by roleId
        const groupedPerms: Record<string, Array<{ resource: string; action: string }>> = {};
        // Initialize empty arrays for all queried roles to handle roles with no permissions
        for (const roleId of roleIds) {
          groupedPerms[roleId] = [];
        }

        for (const p of dbPerms) {
          groupedPerms[p.roleId].push({
            resource: p.resource,
            action: p.action
          });
        }

        // Cache the newly fetched permissions in parallel
        await Promise.all(
          Object.entries(groupedPerms).map(([roleId, perms]) =>
            redis.setex(`permissions:${orgId}:${roleId}`, 300, JSON.stringify(perms))
          )
        );

        // Merge into cachedPermissionsMap
        Object.assign(cachedPermissionsMap, groupedPerms);
      }

      // Collect all permissions and check match
      for (const userRole of roles) {
        const perms = cachedPermissionsMap[userRole.roleId] || [];
        allPermissions.push(...perms);
        const match = perms.some((p) => p.resource === resource && actions.includes(p.action));
        if (match) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        logger.warn(`Security Event: Permission denied. User ${req.user.id} (${req.user.email}) attempted to access resource '${resource}' with action(s) '${actions.join(",")}' but has insufficient permissions.`);
        throw AppError.forbidden("Access denied: insufficient permissions");
      }

      req.permissions = allPermissions;
      next();
    } catch (error) {
      next(error);
    }
  };
}
