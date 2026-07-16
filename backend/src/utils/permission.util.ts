import { prisma } from "../config/database";
import { SystemRole } from "@prisma/client";
import { redis } from "../config/redis";

export async function getPermissionScopes(
  user: any,
  orgId: string,
  resource: string,
  action: string
) {
  // Super Admins and Org Admins have global scopes
  if (
    user.systemRole === SystemRole.SYS_OWNER ||
    user.systemRole === SystemRole.SUPER_ADMIN ||
    user.systemRole === SystemRole.ORG_ADMIN ||
    user.originalRole === SystemRole.SYS_OWNER
  ) {
    return {
      isGlobal: true,
      departmentIds: [],
      teamIds: []
    };
  }

  const cacheKey = `scopes:${orgId}:${user.id}:${resource}:${action}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error("Redis get scopes error:", err);
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            where: { resource, action, organizationId: orgId }
          }
        }
      }
    }
  });

  const scopes = {
    isGlobal: false,
    departmentIds: [] as string[],
    teamIds: [] as string[]
  };

  for (const ur of userRoles) {
    if (ur.role.permissions.length > 0) {
      if (ur.scopeType === "ORG") {
        scopes.isGlobal = true;
      } else if (ur.scopeType === "DEPARTMENT") {
        scopes.departmentIds.push(ur.scopeId);
      } else if (ur.scopeType === "TEAM") {
        scopes.teamIds.push(ur.scopeId);
      }
    }
  }

  try {
    await redis.setex(cacheKey, 300, JSON.stringify(scopes));
  } catch (err) {
    console.error("Redis set scopes error:", err);
  }

  return scopes;
}
