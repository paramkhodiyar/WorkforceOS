import { prisma } from "../../config/database";
import { redis } from "../../config/redis";
import { AppError } from "../../utils/errors.util";
import { AuditAction, RoleScope, Prisma } from "@prisma/client";

export class OrgCanvasService {
  /**
   * Fetches full org structure: departments, teams, employees, roots, and summary metrics.
   */
  static async getOrgTree(orgId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [departments, teams, employees, leaveRequestsToday] = await Promise.all([
      prisma.department.findMany({
        where: { organizationId: orgId, isDeleted: false },
        include: {
          head: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              designation: true
            }
          },
          _count: {
            select: {
              employees: true,
              teams: true
            }
          }
        },
        orderBy: { name: "asc" }
      }),

      prisma.team.findMany({
        where: { department: { organizationId: orgId }, isDeleted: false },
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              designation: true
            }
          },
          department: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: { name: "asc" }
      }),

      prisma.user.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: true,
          avatarUrl: true,
          status: true,
          systemRole: true,
          employeeType: true,
          joinDate: true,
          workLocation: true,
          departmentId: true,
          managerId: true,
          isDeleted: true,
          department: {
            select: {
              id: true,
              name: true
            }
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true,
              avatarUrl: true
            }
          },
          teams: {
            select: {
              id: true,
              name: true,
              departmentId: true
            }
          },
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  isSystem: true
                }
              }
            }
          }
        },
        orderBy: { firstName: "asc" }
      }),

      prisma.leaveRequest.findMany({
        where: {
          user: { organizationId: orgId },
          status: { in: ["HR_APPROVED", "MANAGER_APPROVED"] },
          startDate: { lte: tomorrow },
          endDate: { gte: today }
        },
        select: { userId: true }
      })
    ]);

    const onLeaveUserIds = new Set(leaveRequestsToday.map((l) => l.userId));

    // Determine root nodes (users with no manager)
    const roots = employees.filter((e) => !e.managerId && !e.isDeleted);

    const activeCount = employees.filter((e) => e.status === "ACTIVE" && !e.isDeleted).length;

    return {
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        headId: d.headId,
        head: d.head,
        userCount: d._count.employees,
        teamCount: d._count.teams
      })),
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        departmentId: t.departmentId,
        departmentName: t.department?.name,
        leadId: t.leadId,
        lead: t.lead,
        memberCount: t._count.members
      })),
      employees: employees.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        name: `${e.firstName} ${e.lastName}`,
        email: e.email,
        designation: e.designation || "Employee",
        avatarUrl: e.avatarUrl,
        status: e.status,
        systemRole: e.systemRole,
        employeeType: e.employeeType,
        joiningDate: e.joinDate,
        workLocation: e.workLocation,
        departmentId: e.departmentId,
        departmentName: e.department?.name || null,
        managerId: e.managerId,
        managerName: e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : null,
        teams: e.teams.map((t) => ({ id: t.id, name: t.name, departmentId: t.departmentId })),
        roles: e.roles.map((ur) => ur.role),
        isOnLeaveToday: onLeaveUserIds.has(e.id),
        isDeleted: e.isDeleted
      })),
      roots: roots.map((r) => r.id),
      stats: {
        totalEmployees: employees.length,
        activeCount,
        onLeaveToday: onLeaveUserIds.size,
        totalDepartments: departments.length,
        totalTeams: teams.length
      }
    };
  }

  /**
   * Returns members of a specific team.
   */
  static async getTeamMembers(orgId: string, teamId: string) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, department: { organizationId: orgId }, isDeleted: false },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            avatarUrl: true,
            status: true,
            departmentId: true,
            managerId: true
          }
        }
      }
    });

    if (!team) {
      throw AppError.notFound("Team not found");
    }

    return team.members;
  }

  /**
   * Searches matching nodes across employees, departments, and teams.
   */
  static async searchNodes(orgId: string, q: string) {
    const query = q.trim().toLowerCase();
    if (!query) return { employees: [], departments: [], teams: [] };

    const [employees, departments, teams] = await Promise.all([
      prisma.user.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { designation: { contains: query, mode: "insensitive" } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          avatarUrl: true,
          departmentId: true,
          managerId: true
        },
        take: 15
      }),

      prisma.department.findMany({
        where: {
          organizationId: orgId,
          isDeleted: false,
          name: { contains: query, mode: "insensitive" }
        },
        select: { id: true, name: true },
        take: 10
      }),

      prisma.team.findMany({
        where: {
          department: { organizationId: orgId },
          isDeleted: false,
          name: { contains: query, mode: "insensitive" }
        },
        select: { id: true, name: true, departmentId: true },
        take: 10
      })
    ]);

    return {
      employees: employees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        designation: e.designation,
        avatarUrl: e.avatarUrl,
        departmentId: e.departmentId,
        managerId: e.managerId
      })),
      departments,
      teams
    };
  }

  /**
   * Reassigns employee's manager with circular reporting validation.
   */
  static async reassignManager(
    orgId: string,
    actorId: string,
    userId: string,
    newManagerId?: string | null
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId }
    });
    if (!user) {
      throw AppError.notFound("Employee not found");
    }

    if (newManagerId) {
      if (newManagerId === userId) {
        throw AppError.badRequest("An employee cannot report to themselves");
      }

      const targetManager = await prisma.user.findFirst({
        where: { id: newManagerId, organizationId: orgId }
      });
      if (!targetManager) {
        throw AppError.notFound("Target manager not found");
      }

      // Check circular reporting chain (walk managerId chain up from targetManager)
      let currId: string | null = targetManager.managerId;
      const visited = new Set<string>([targetManager.id]);

      while (currId) {
        if (currId === userId) {
          throw AppError.badRequest(
            `Circular reporting line detected: ${targetManager.firstName} ${targetManager.lastName} is a report of ${user.firstName} ${user.lastName}`
          );
        }
        if (visited.has(currId)) break; // Prevents infinite loop on broken data
        visited.add(currId);

        const parent = await prisma.user.findUnique({
          where: { id: currId },
          select: { managerId: true }
        });
        currId = parent?.managerId || null;
      }
    }

    const oldManagerId = user.managerId;

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { managerId: newManagerId || null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          managerId: true
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "org-canvas",
          targetId: userId,
          targetType: "User",
          oldValue: { managerId: oldManagerId },
          newValue: { managerId: newManagerId || null }
        }
      });

      return updatedUser;
    });
  }

  /**
   * Reassigns an employee's department and optional team.
   */
  static async reassignDepartment(
    orgId: string,
    actorId: string,
    userId: string,
    newDepartmentId?: string | null,
    newTeamId?: string | null
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId }
    });
    if (!user) {
      throw AppError.notFound("Employee not found");
    }

    if (newDepartmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: newDepartmentId, organizationId: orgId, isDeleted: false }
      });
      if (!dept) {
        throw AppError.notFound("Department not found");
      }
    }

    if (newTeamId) {
      const team = await prisma.team.findFirst({
        where: { id: newTeamId, department: { organizationId: orgId }, isDeleted: false }
      });
      if (!team) {
        throw AppError.notFound("Team not found");
      }
    }

    const oldDeptId = user.departmentId;

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          departmentId: newDepartmentId || null,
          teams: newTeamId
            ? { set: [{ id: newTeamId }] }
            : undefined
        },
        select: { id: true, firstName: true, lastName: true, departmentId: true }
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "org-canvas",
          targetId: userId,
          targetType: "User",
          oldValue: { departmentId: oldDeptId },
          newValue: { departmentId: newDepartmentId || null, newTeamId: newTeamId || null }
        }
      });

      return updatedUser;
    });
  }

  /**
   * Moves a team under a different department.
   */
  static async moveTeam(orgId: string, actorId: string, teamId: string, newDepartmentId: string) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, department: { organizationId: orgId }, isDeleted: false }
    });
    if (!team) {
      throw AppError.notFound("Team not found");
    }

    const department = await prisma.department.findFirst({
      where: { id: newDepartmentId, organizationId: orgId, isDeleted: false }
    });
    if (!department) {
      throw AppError.notFound("Department not found");
    }

    const oldDeptId = team.departmentId;

    return prisma.$transaction(async (tx) => {
      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data: { departmentId: newDepartmentId },
        select: { id: true, name: true, departmentId: true }
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "org-canvas",
          targetId: teamId,
          targetType: "Team",
          oldValue: { departmentId: oldDeptId },
          newValue: { departmentId: newDepartmentId }
        }
      });

      return updatedTeam;
    });
  }

  /**
   * Role & Permission Management
   */
  static async getRoles(orgId: string) {
    return prisma.role.findMany({
      where: { organizationId: orgId, isDeleted: false },
      include: {
        permissions: {
          select: {
            id: true,
            resource: true,
            action: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy: { name: "asc" }
    });
  }

  static async createRole(
    orgId: string,
    actorId: string,
    data: { name: string; permissions: Array<{ resource: string; action: string }> }
  ) {
    const existingRole = await prisma.role.findFirst({
      where: { organizationId: orgId, name: data.name, isDeleted: false }
    });
    if (existingRole) {
      throw AppError.badRequest(`Role '${data.name}' already exists in your organization`);
    }

    return prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: data.name,
          organizationId: orgId,
          isSystem: false
        }
      });

      if (data.permissions && data.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissions.map((p) => ({
            roleId: role.id,
            organizationId: orgId,
            resource: p.resource,
            action: p.action
          }))
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.CREATED,
          module: "org-canvas",
          targetId: role.id,
          targetType: "Role",
          oldValue: Prisma.JsonNull,
          newValue: { roleName: role.name, permissionsCount: data.permissions.length }
        }
      });

      return role;
    });
  }

  static async updateRole(
    orgId: string,
    actorId: string,
    roleId: string,
    data: { name?: string; permissions?: Array<{ resource: string; action: string }> }
  ) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId, isDeleted: false }
    });
    if (!role) {
      throw AppError.notFound("Role not found");
    }

    return prisma.$transaction(async (tx) => {
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name: data.name ?? role.name
        }
      });

      if (data.permissions) {
        await tx.rolePermission.deleteMany({
          where: { roleId, organizationId: orgId }
        });

        if (data.permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissions.map((p) => ({
              roleId,
              organizationId: orgId,
              resource: p.resource,
              action: p.action
            }))
          });
        }
      }

      // Invalidate Redis cache for this role
      await redis.del(`permissions:${orgId}:${roleId}`).catch(() => {});

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "org-canvas",
          targetId: roleId,
          targetType: "Role",
          oldValue: { roleName: role.name },
          newValue: { roleName: updatedRole.name, updatedPermissions: data.permissions?.length ?? 0 }
        }
      });

      return updatedRole;
    });
  }

  static async deleteRole(orgId: string, actorId: string, roleId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId, isDeleted: false }
    });
    if (!role) {
      throw AppError.notFound("Role not found");
    }

    if (role.isSystem) {
      throw AppError.badRequest("System default roles cannot be deleted");
    }

    return prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.userRole.deleteMany({ where: { roleId } });
      const deletedRole = await tx.role.update({
        where: { id: roleId },
        data: { isDeleted: true }
      });

      await redis.del(`permissions:${orgId}:${roleId}`).catch(() => {});

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.DELETED,
          module: "org-canvas",
          targetId: roleId,
          targetType: "Role",
          oldValue: { roleName: role.name },
          newValue: Prisma.JsonNull
        }
      });

      return deletedRole;
    });
  }

  static async assignUserRole(
    orgId: string,
    actorId: string,
    userId: string,
    roleId: string,
    action: "add" | "remove"
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId }
    });
    if (!user) throw AppError.notFound("User not found");

    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId, isDeleted: false }
    });
    if (!role) throw AppError.notFound("Role not found");

    return prisma.$transaction(async (tx) => {
      if (action === "add") {
        const existing = await tx.userRole.findFirst({
          where: { userId, roleId }
        });
        if (!existing) {
          await tx.userRole.create({
            data: {
              userId,
              roleId,
              scopeType: RoleScope.ORG,
              scopeId: orgId
            }
          });
        }
      } else {
        await tx.userRole.deleteMany({
          where: { userId, roleId }
        });
      }

      await redis.del(`permissions:${orgId}:${roleId}`).catch(() => {});

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "org-canvas",
          targetId: userId,
          targetType: "UserRole",
          oldValue: Prisma.JsonNull,
          newValue: {
            actionType: action,
            userName: `${user.firstName} ${user.lastName}`,
            roleName: role.name
          }
        }
      });

      return { success: true };
    });
  }

  /**
   * Promotes/updates an employee's executive designation (CEO, CTO, MD, CXO, VP, etc.) and optional systemRole.
   */
  static async promoteExecutive(
    orgId: string,
    actorId: string,
    userId: string,
    designation: string,
    systemRole?: "SUPER_ADMIN" | "ORG_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId }
    });
    if (!user) {
      throw AppError.notFound("Employee not found");
    }

    const oldDesignation = user.designation;
    const oldSystemRole = user.systemRole;

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          designation,
          systemRole: systemRole ?? user.systemRole
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          systemRole: true
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "org-canvas",
          targetId: userId,
          targetType: "User",
          oldValue: { designation: oldDesignation, systemRole: oldSystemRole },
          newValue: { designation, systemRole: updatedUser.systemRole }
        }
      });

      return updatedUser;
    });
  }
}
