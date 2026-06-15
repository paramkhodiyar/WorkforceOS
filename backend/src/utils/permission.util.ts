import { prisma } from "../config/database";
import { SystemRole } from "@prisma/client";

export async function getPermissionScopes(
  user: any,
  orgId: string,
  resource: string,
  action: string
) {
  // Super Admins and Org Admins have global scopes
  if (user.systemRole === SystemRole.SUPER_ADMIN || user.systemRole === SystemRole.ORG_ADMIN) {
    return {
      isGlobal: true,
      departmentIds: [],
      teamIds: []
    };
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

  return scopes;
}
