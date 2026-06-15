import { prisma } from "../../config/database";
import { TaskStatus, TaskPriority, AuditAction, NotificationType, TaskScope } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { TASK_TRANSITIONS } from "../../config/constants";
import { getPermissionScopes } from "../../utils/permission.util";

export class TasksService {
  static validateStateTransition(current: TaskStatus, next: TaskStatus) {
    const allowed = TASK_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
      throw AppError.badRequest(`Invalid task state transition from ${current} to ${next}`);
    }
  }

  static async isEligibleReviewer(task: any, userId: string, orgId: string) {
    if (task.creatorId === userId) return true;
    if (task.reviewerIds && task.reviewerIds.includes(userId)) return true;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });
    if (!user) return false;

    const isHR = user.roles.some((r: any) => r.roleName === "HR_MANAGER");
    const isAdmin = user.systemRole === "SUPER_ADMIN" || user.systemRole === "ORG_ADMIN";
    if (isHR || isAdmin) return true;

    if (task.scope === "TEAM" && task.teamId) {
      const team = await prisma.team.findFirst({
        where: { id: task.teamId, leadId: userId, isDeleted: false }
      });
      if (team) return true;
    }

    if (task.scope === "DEPARTMENT" && task.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: task.departmentId, headId: userId, isDeleted: false }
      });
      if (dept) return true;
    }

    return false;
  }

  static async isEligibleToClose(task: any, userId: string) {
    if (task.creatorId === userId) return true;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });
    if (!user) return false;

    const isHR = user.roles.some((r: any) => r.roleName === "HR_MANAGER");
    const isAdmin = user.systemRole === "SUPER_ADMIN" || user.systemRole === "ORG_ADMIN";
    if (isHR || isAdmin) return true;

    if (task.scope === "TEAM" && task.teamId) {
      const team = await prisma.team.findFirst({
        where: { id: task.teamId, leadId: userId, isDeleted: false }
      });
      if (team) return true;
    }

    if (task.scope === "DEPARTMENT" && task.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: task.departmentId, headId: userId, isDeleted: false }
      });
      if (dept) return true;
    }

    return false;
  }

  static async validateStatusChangePermission(task: any, from: TaskStatus, to: TaskStatus, actorId: string, orgId: string) {
    this.validateStateTransition(from, to);

    const isAssignee = task.assigneeId === actorId;
    const isCreator = task.creatorId === actorId;

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      include: { roles: true }
    });
    const isHR = actor?.roles.some((r: any) => r.roleName === "HR_MANAGER") || false;
    const isAdmin = actor?.systemRole === "SUPER_ADMIN" || actor?.systemRole === "ORG_ADMIN" || false;

    // Draft/Assign transitions
    if (from === TaskStatus.DRAFT) {
      if (!isCreator && !isAdmin && !isHR) {
        throw AppError.forbidden("Only the creator or admin/HR can transition from DRAFT");
      }
    }

    if (from === TaskStatus.ASSIGNED) {
      if (to === TaskStatus.ACCEPTED) {
        if (!isAssignee) {
          throw AppError.forbidden("Only the assignee can accept a task");
        }
      } else if (to === TaskStatus.DRAFT) {
        if (!isCreator && !isAdmin && !isHR) {
          throw AppError.forbidden("Only the creator or admin/HR can unassign a task");
        }
      }
    }

    if (from === TaskStatus.ACCEPTED) {
      if (to === TaskStatus.IN_PROGRESS) {
        if (!isAssignee) {
          throw AppError.forbidden("Only the assignee can start a task");
        }
      } else if (to === TaskStatus.DRAFT) {
        if (!isCreator && !isAdmin && !isHR) {
          throw AppError.forbidden("Only the creator or admin/HR can unassign a task");
        }
      }
    }

    if (from === TaskStatus.IN_PROGRESS) {
      if (to === TaskStatus.SUBMITTED) {
        if (!isAssignee) {
          throw AppError.forbidden("Only the assignee can submit a task");
        }
      } else if (to === TaskStatus.CLOSED) {
        const canClose = await this.isEligibleToClose(task, actorId);
        if (!canClose) {
          throw AppError.forbidden("You do not have permission to close this task");
        }
      }
    }

    if (from === TaskStatus.SUBMITTED) {
      const isReviewer = await this.isEligibleReviewer(task, actorId, orgId);
      if (!isReviewer) {
        throw AppError.forbidden("Only an eligible reviewer can review this task");
      }
    }

    if (from === TaskStatus.IN_REVIEW) {
      const isReviewer = await this.isEligibleReviewer(task, actorId, orgId);
      if (!isReviewer) {
        throw AppError.forbidden("Only an eligible reviewer can approve or request changes on this task");
      }
    }

    if (from === TaskStatus.CHANGES_REQUESTED) {
      if (to === TaskStatus.RESUBMITTED) {
        if (!isAssignee) {
          throw AppError.forbidden("Only the assignee can resubmit a task");
        }
      } else if (to === TaskStatus.CLOSED) {
        const canClose = await this.isEligibleToClose(task, actorId);
        if (!canClose) {
          throw AppError.forbidden("You do not have permission to close this task");
        }
      }
    }

    if (from === TaskStatus.RESUBMITTED) {
      const isReviewer = await this.isEligibleReviewer(task, actorId, orgId);
      if (!isReviewer) {
        throw AppError.forbidden("Only an eligible reviewer can re-review this task");
      }
    }

    if (from === TaskStatus.APPROVED) {
      const canClose = await this.isEligibleToClose(task, actorId);
      if (!canClose) {
        throw AppError.forbidden("You do not have permission to close this task");
      }
    }
  }

  static async createTask(
    orgId: string,
    creatorId: string,
    data: {
      title: string;
      description?: string;
      assigneeId?: string;
      priority?: TaskPriority;
      dueDate?: Date;
      parentTaskId?: string;
      dependencies?: string[];
      scope?: TaskScope;
      teamId?: string;
      departmentId?: string;
      reviewerIds?: string[];
    },
    req?: any
  ) {
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      include: { roles: true }
    });

    if (!creator) {
      throw AppError.notFound("Creator user not found");
    }

    const isIntern = creator.systemRole === "INTERN" || creator.roles.some((r: any) => r.roleName === "INTERN");
    if (isIntern) {
      throw AppError.forbidden("Interns are not allowed to create tasks");
    }

    const scope = data.scope || TaskScope.PERSONAL;
    const isHR = creator.roles.some((r: any) => r.roleName === "HR_MANAGER");
    const isAdmin = creator.systemRole === "SUPER_ADMIN" || creator.systemRole === "ORG_ADMIN";

    let finalAssigneeId = data.assigneeId;

    // Scope creation rules validation
    if (scope === TaskScope.PERSONAL) {
      if (data.assigneeId && data.assigneeId !== creatorId) {
        throw AppError.badRequest("Personal tasks can only be assigned to yourself");
      }
      finalAssigneeId = creatorId;
    } else if (scope === TaskScope.TEAM) {
      if (!data.teamId) {
        throw AppError.badRequest("Team ID is required for team-scoped tasks");
      }
      if (!isAdmin && !isHR) {
        const team = await prisma.team.findFirst({
          where: { id: data.teamId, leadId: creatorId, isDeleted: false }
        });
        if (!team) {
          throw AppError.forbidden("You must be the team lead to create a team-scoped task");
        }
      }
      if (data.assigneeId) {
        const isMember = await prisma.user.findFirst({
          where: { id: data.assigneeId, teams: { some: { id: data.teamId } }, isDeleted: false }
        });
        if (!isMember) {
          throw AppError.badRequest("Assignee must be a member of the specified team");
        }
      }
    } else if (scope === TaskScope.DEPARTMENT) {
      if (!data.departmentId) {
        throw AppError.badRequest("Department ID is required for department-scoped tasks");
      }
      if (!isAdmin && !isHR) {
        const dept = await prisma.department.findFirst({
          where: { id: data.departmentId, headId: creatorId, isDeleted: false }
        });
        if (!dept) {
          throw AppError.forbidden("You must be the department head to create a department-scoped task");
        }
      }
      if (data.assigneeId) {
        const isMember = await prisma.user.findFirst({
          where: { id: data.assigneeId, departmentId: data.departmentId, isDeleted: false }
        });
        if (!isMember) {
          throw AppError.badRequest("Assignee must be a member of the specified department");
        }
      }
    } else if (scope === TaskScope.ORG) {
      if (!isAdmin && !isHR) {
        throw AppError.forbidden("Only HR or Org Admin can create organization-scoped tasks");
      }
      if (data.assigneeId) {
        const assignee = await prisma.user.findFirst({
          where: { id: data.assigneeId, organizationId: orgId, isDeleted: false }
        });
        if (!assignee) {
          throw AppError.badRequest("Assignee must belong to the organization");
        }
      }
    }

    const lastTask = await prisma.task.findFirst({
      orderBy: { taskId: "desc" },
      select: { taskId: true },
      ignoreSoftDelete: true
    } as any);
    let nextNum = 1;
    if (lastTask && lastTask.taskId) {
      const match = lastTask.taskId.match(/TASK-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const taskId = `TASK-${String(nextNum).padStart(4, "0")}`;

    const status = finalAssigneeId ? TaskStatus.ASSIGNED : TaskStatus.DRAFT;

    const task = await prisma.task.create({
      data: {
        taskId,
        title: data.title,
        description: data.description,
        creatorId,
        assigneeId: finalAssigneeId || null,
        status,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        parentTaskId: data.parentTaskId || null,
        scope,
        orgId,
        teamId: scope === TaskScope.TEAM ? data.teamId : null,
        departmentId: scope === TaskScope.DEPARTMENT ? data.departmentId : null,
        reviewerIds: data.reviewerIds || []
      }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        fromStatus: null,
        toStatus: status,
        changedBy: creatorId
      }
    });

    if (data.dependencies && data.dependencies.length > 0) {
      for (const depId of data.dependencies) {
        await prisma.taskDependency.create({
          data: {
            dependentId: task.id,
            dependencyId: depId
          }
        });
      }
    }

    await AuditService.log({
      organizationId: orgId,
      actorId: creatorId,
      action: AuditAction.CREATED,
      module: "tasks",
      targetId: task.id,
      targetType: "Task",
      newValue: { taskId, status },
      req
    });

    if (data.assigneeId) {
      await NotificationService.notify(
        data.assigneeId,
        NotificationType.TASK_ASSIGNED,
        "New Task Assigned",
        `You have been assigned the task: ${data.title}`,
        { taskId: task.id }
      );
    }

    return task;
  }

  static async listTasks(
    orgId: string,
    user: any,
    filters: {
      status?: TaskStatus;
      assigneeId?: string;
      creatorId?: string;
      priority?: TaskPriority;
      fromDate?: Date;
      toDate?: Date;
      overdue?: boolean;
      departmentId?: string;
      teamId?: string;
    },
    page: number,
    limit: number
  ) {
    const where: any = {
      isDeleted: false,
      creator: { organizationId: orgId }
    };

    const orgScopes = await getPermissionScopes(user, orgId, "task", "read:org");
    const assignedScopes = await getPermissionScopes(user, orgId, "task", "read:assigned");
    const createdScopes = await getPermissionScopes(user, orgId, "task", "read:created");

    const isGlobal = orgScopes.isGlobal;
    if (!isGlobal) {
      const departmentIds = Array.from(new Set([...assignedScopes.departmentIds, ...createdScopes.departmentIds]));
      const teamIds = Array.from(new Set([...assignedScopes.teamIds, ...createdScopes.teamIds]));

      // Fetch teams led by the user
      const ledTeams = await prisma.team.findMany({
        where: { leadId: user.id, isDeleted: false },
        select: { id: true }
      });
      const ledTeamIds = ledTeams.map((t) => t.id);

      // Fetch departments headed by the user
      const headedDepts = await prisma.department.findMany({
        where: { headId: user.id, isDeleted: false },
        select: { id: true }
      });
      const headedDeptIds = headedDepts.map((d) => d.id);

      const conditions: any[] = [
        { creatorId: user.id },
        { assigneeId: user.id },
        { reviewerIds: { has: user.id } }
      ];

      if (departmentIds.length > 0) {
        conditions.push({ assignee: { departmentId: { in: departmentIds } } });
      }
      if (teamIds.length > 0) {
        conditions.push({ assignee: { teams: { some: { id: { in: teamIds } } } } });
      }

      if (ledTeamIds.length > 0) {
        conditions.push({ teamId: { in: ledTeamIds }, scope: TaskScope.TEAM });
      }
      if (headedDeptIds.length > 0) {
        conditions.push({ departmentId: { in: headedDeptIds }, scope: TaskScope.DEPARTMENT });
      }

      // Add extra filters if specified and authorized by scope
      const userDeptId = user.departmentId;
      const userTeams = await prisma.team.findMany({
        where: { members: { some: { id: user.id } }, isDeleted: false },
        select: { id: true }
      });
      const memberTeamIds = userTeams.map((t) => t.id);

      if (filters.teamId && (teamIds.includes(filters.teamId) || memberTeamIds.includes(filters.teamId) || ledTeamIds.includes(filters.teamId))) {
        conditions.push({ assignee: { teams: { some: { id: filters.teamId } } } });
      }
      if (filters.departmentId && (departmentIds.includes(filters.departmentId) || userDeptId === filters.departmentId || headedDeptIds.includes(filters.departmentId))) {
        conditions.push({ assignee: { departmentId: filters.departmentId } });
      }

      where.OR = conditions;
    }

    if (filters.status) where.status = filters.status;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.creatorId) where.creatorId = filters.creatorId;
    if (filters.priority) where.priority = filters.priority;

    if (filters.fromDate || filters.toDate) {
      where.dueDate = {};
      if (filters.fromDate) where.dueDate.gte = filters.fromDate;
      if (filters.toDate) where.dueDate.lte = filters.toDate;
    }

    if (filters.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: [TaskStatus.CLOSED, TaskStatus.APPROVED] };
    }

    if (filters.departmentId) {
      where.assignee = {
        ...where.assignee,
        departmentId: filters.departmentId
      };
    }

    if (filters.teamId) {
      where.assignee = {
        ...where.assignee,
        teams: {
          some: {
            id: filters.teamId
          }
        }
      };
    }

    const total = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return { tasks, total };
  }

  static async getTaskById(id: string, orgId: string, user: any) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false, creator: { organizationId: orgId } },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            departmentId: true,
            teams: {
              select: { id: true }
            }
          }
        },
        subtasks: { where: { isDeleted: false } },
        comments: {
          where: { isDeleted: false },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        attachments: true,
        reviews: {
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        },
        dependencies: { include: { dependencyTask: true } },
        dependents: { include: { dependentTask: true } }
      }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    const orgScopes = await getPermissionScopes(user, orgId, "task", "read:org");
    if (!orgScopes.isGlobal) {
      const isCreatorOrAssignee = task.creatorId === user.id || task.assigneeId === user.id;
      let hasAccess = isCreatorOrAssignee;

      if (!hasAccess && task.reviewerIds.includes(user.id)) {
        hasAccess = true;
      }

      if (!hasAccess && task.scope === TaskScope.TEAM && task.teamId) {
        const team = await prisma.team.findFirst({
          where: { id: task.teamId, leadId: user.id, isDeleted: false }
        });
        if (team) hasAccess = true;
      }

      if (!hasAccess && task.scope === TaskScope.DEPARTMENT && task.departmentId) {
        const dept = await prisma.department.findFirst({
          where: { id: task.departmentId, headId: user.id, isDeleted: false }
        });
        if (dept) hasAccess = true;
      }

      if (!hasAccess) {
        throw AppError.forbidden("Access denied: you do not have permission to view this task");
      }
    }

    return task;
  }

  static async updateTask(id: string, orgId: string, actorId: string, data: any, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      include: { roles: true }
    });

    if (!actor) {
      throw AppError.notFound("Actor user not found");
    }

    const isHR = actor.roles.some((r: any) => r.roleName === "HR_MANAGER");
    const isAdmin = actor.systemRole === "SUPER_ADMIN" || actor.systemRole === "ORG_ADMIN";
    const isCreator = task.creatorId === actorId;

    const metaKeys = ["title", "description", "priority", "dueDate", "parentTaskId", "scope", "teamId", "departmentId", "reviewerIds", "assigneeId"];
    const hasMetaUpdates = Object.keys(data).some(key => metaKeys.includes(key));

    if (hasMetaUpdates && !isCreator && !isAdmin && !isHR) {
      throw AppError.forbidden("Only the task creator or an admin/HR can edit task details");
    }

    // Assignee and scope checking on metadata updates
    const checkScope = data.scope || task.scope;
    const checkTeamId = data.teamId || task.teamId;
    const checkDeptId = data.departmentId || task.departmentId;
    const checkAssigneeId = data.assigneeId !== undefined ? data.assigneeId : task.assigneeId;

    if (checkAssigneeId) {
      if (checkScope === TaskScope.PERSONAL) {
        if (checkAssigneeId !== task.creatorId) {
          throw AppError.badRequest("Personal tasks can only be assigned to yourself");
        }
      } else if (checkScope === TaskScope.TEAM) {
        if (!checkTeamId) {
          throw AppError.badRequest("Team ID is required for team-scoped tasks");
        }
        const isMember = await prisma.user.findFirst({
          where: { id: checkAssigneeId, teams: { some: { id: checkTeamId } }, isDeleted: false }
        });
        if (!isMember) {
          throw AppError.badRequest("Assignee must be a member of the specified team");
        }
      } else if (checkScope === TaskScope.DEPARTMENT) {
        if (!checkDeptId) {
          throw AppError.badRequest("Department ID is required for department-scoped tasks");
        }
        const isMember = await prisma.user.findFirst({
          where: { id: checkAssigneeId, departmentId: checkDeptId, isDeleted: false }
        });
        if (!isMember) {
          throw AppError.badRequest("Assignee must be a member of the specified department");
        }
      } else if (checkScope === TaskScope.ORG) {
        const assignee = await prisma.user.findFirst({
          where: { id: checkAssigneeId, organizationId: orgId, isDeleted: false }
        });
        if (!assignee) {
          throw AppError.badRequest("Assignee must belong to the organization");
        }
      }
    }

    if (data.status && data.status !== task.status) {
      await this.validateStatusChangePermission(task, task.status, data.status, actorId, orgId);

      await prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: task.status,
          toStatus: data.status,
          changedBy: actorId
        }
      });

      await AuditService.log({
        organizationId: orgId,
        actorId,
        action: AuditAction.STATUS_CHANGED,
        module: "tasks",
        targetId: id,
        targetType: "Task",
        oldValue: { status: task.status },
        newValue: { status: data.status },
        req
      });
    }

    const updated = await prisma.task.update({
      where: { id },
      data
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      oldValue: task,
      newValue: updated,
      req
    });

    return updated;
  }

  static async deleteTask(id: string, orgId: string, user: any, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    const deleteScopes = await getPermissionScopes(user, orgId, "task", "delete");
    const isCreator = task.creatorId === user.id;

    if (!isCreator && !deleteScopes.isGlobal) {
      throw AppError.forbidden("Only the creator or an admin can delete this task");
    }

    await prisma.task.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: user.id,
      action: AuditAction.DELETED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      req
    });
  }

  static async assignTask(id: string, orgId: string, assigneeId: string, actorId: string, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    const newStatus = TaskStatus.ASSIGNED;
    await this.validateStatusChangePermission(task, task.status, newStatus, actorId, orgId);

    // Enforce assignee scope validation!
    if (task.scope === TaskScope.PERSONAL) {
      if (assigneeId !== task.creatorId) {
        throw AppError.badRequest("Personal tasks can only be assigned to yourself");
      }
    } else if (task.scope === TaskScope.TEAM) {
      if (!task.teamId) {
        throw AppError.badRequest("Team ID is missing on the task");
      }
      const isMember = await prisma.user.findFirst({
        where: { id: assigneeId, teams: { some: { id: task.teamId } }, isDeleted: false }
      });
      if (!isMember) {
        throw AppError.badRequest("Assignee must be a member of the specified team");
      }
    } else if (task.scope === TaskScope.DEPARTMENT) {
      if (!task.departmentId) {
        throw AppError.badRequest("Department ID is missing on the task");
      }
      const isMember = await prisma.user.findFirst({
        where: { id: assigneeId, departmentId: task.departmentId, isDeleted: false }
      });
      if (!isMember) {
        throw AppError.badRequest("Assignee must be a member of the specified department");
      }
    } else if (task.scope === TaskScope.ORG) {
      const assignee = await prisma.user.findFirst({
        where: { id: assigneeId, organizationId: orgId, isDeleted: false }
      });
      if (!assignee) {
        throw AppError.badRequest("Assignee must belong to the organization");
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        status: newStatus
      }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        fromStatus: task.status,
        toStatus: newStatus,
        changedBy: actorId
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.STATUS_CHANGED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      oldValue: { status: task.status, assigneeId: task.assigneeId },
      newValue: { status: newStatus, assigneeId },
      req
    });

    await NotificationService.notify(
      assigneeId,
      NotificationType.TASK_ASSIGNED,
      "Task Assigned",
      `You have been assigned the task: ${task.title}`,
      { taskId: id }
    );

    return updated;
  }

  static async acceptTask(id: string, orgId: string, userId: string, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, assigneeId: userId, isDeleted: false }
    });

    if (!task) {
      throw AppError.notFound("Assigned task not found");
    }

    await this.validateStatusChangePermission(task, task.status, TaskStatus.ACCEPTED, userId, orgId);

    const updated = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.ACCEPTED }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        fromStatus: task.status,
        toStatus: TaskStatus.ACCEPTED,
        changedBy: userId
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.STATUS_CHANGED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      oldValue: { status: task.status },
      newValue: { status: TaskStatus.ACCEPTED },
      req
    });

    return updated;
  }

  static async submitTask(id: string, orgId: string, userId: string, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, assigneeId: userId, isDeleted: false }
    });

    if (!task) {
      throw AppError.notFound("Assigned task not found");
    }

    const currentStatus = task.status;
    const nextStatus = TaskStatus.SUBMITTED;

    // Check transition permission
    if (currentStatus === TaskStatus.ACCEPTED) {
      await this.validateStatusChangePermission(task, TaskStatus.ACCEPTED, TaskStatus.IN_PROGRESS, userId, orgId);
      const updatedTaskObj = { ...task, status: TaskStatus.IN_PROGRESS };
      await this.validateStatusChangePermission(updatedTaskObj, TaskStatus.IN_PROGRESS, nextStatus, userId, orgId);

      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.IN_PROGRESS }
      });
      await prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: TaskStatus.ACCEPTED,
          toStatus: TaskStatus.IN_PROGRESS,
          changedBy: userId
        }
      });
      await prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: TaskStatus.IN_PROGRESS,
          toStatus: nextStatus,
          changedBy: userId
        }
      });
    } else {
      await this.validateStatusChangePermission(task, currentStatus, nextStatus, userId, orgId);
      await prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: currentStatus,
          toStatus: nextStatus,
          changedBy: userId
        }
      });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: nextStatus }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.STATUS_CHANGED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      oldValue: { status: currentStatus },
      newValue: { status: nextStatus },
      req
    });

    await NotificationService.notify(
      task.creatorId,
      NotificationType.TASK_STATUS_CHANGED,
      "Task Submitted for Review",
      `The task "${task.title}" has been submitted by assignee.`,
      { taskId: id }
    );

    return updated;
  }

  static async reviewTask(
    id: string,
    orgId: string,
    reviewerId: string,
    score: number,
    comment: string,
    action: "APPROVED" | "CHANGES_REQUESTED",
    req?: any
  ) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    await this.validateStatusChangePermission(task, task.status, TaskStatus.IN_REVIEW, reviewerId, orgId);

    await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.IN_REVIEW }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        fromStatus: task.status,
        toStatus: TaskStatus.IN_REVIEW,
        changedBy: reviewerId
      }
    });

    const updatedTaskObj = { ...task, status: TaskStatus.IN_REVIEW };
    const nextStatus = action === "APPROVED" ? TaskStatus.APPROVED : TaskStatus.CHANGES_REQUESTED;
    await this.validateStatusChangePermission(updatedTaskObj, TaskStatus.IN_REVIEW, nextStatus, reviewerId, orgId);

    const updated = await prisma.task.update({
      where: { id },
      data: { status: nextStatus }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        fromStatus: TaskStatus.IN_REVIEW,
        toStatus: nextStatus,
        changedBy: reviewerId
      }
    });

    await prisma.taskReview.create({
      data: {
        taskId: id,
        reviewerId,
        score,
        comment,
        action
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: reviewerId,
      action: action === "APPROVED" ? AuditAction.APPROVED : AuditAction.REJECTED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      oldValue: { status: task.status },
      newValue: { status: nextStatus },
      req
    });

    if (task.assigneeId) {
      await NotificationService.notify(
        task.assigneeId,
        NotificationType.TASK_STATUS_CHANGED,
        action === "APPROVED" ? "Task Approved" : "Changes Requested on Task",
        `Review submitted for "${task.title}": ${action}. Score: ${score}`,
        { taskId: id }
      );
    }

    return updated;
  }

  static async resubmitTask(id: string, orgId: string, userId: string, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, assigneeId: userId, isDeleted: false }
    });

    if (!task) {
      throw AppError.notFound("Assigned task not found");
    }

    await this.validateStatusChangePermission(task, task.status, TaskStatus.RESUBMITTED, userId, orgId);

    const updated = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.RESUBMITTED }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        fromStatus: task.status,
        toStatus: TaskStatus.RESUBMITTED,
        changedBy: userId
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.STATUS_CHANGED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      oldValue: { status: task.status },
      newValue: { status: TaskStatus.RESUBMITTED },
      req
    });

    await NotificationService.notify(
      task.creatorId,
      NotificationType.TASK_STATUS_CHANGED,
      "Task Resubmitted",
      `The task "${task.title}" has been resubmitted after changes.`,
      { taskId: id }
    );

    return updated;
  }

  static async closeTask(id: string, orgId: string, userId: string, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    const currentStatus = task.status;
    const nextStatus = TaskStatus.CLOSED;

    if (currentStatus === TaskStatus.ACCEPTED) {
      await this.validateStatusChangePermission(task, TaskStatus.ACCEPTED, TaskStatus.IN_PROGRESS, userId, orgId);
      const updatedTaskObj = { ...task, status: TaskStatus.IN_PROGRESS };
      await this.validateStatusChangePermission(updatedTaskObj, TaskStatus.IN_PROGRESS, nextStatus, userId, orgId);

      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.IN_PROGRESS }
      });
      await prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: TaskStatus.ACCEPTED,
          toStatus: TaskStatus.IN_PROGRESS,
          changedBy: userId
        }
      });
    } else if (currentStatus === TaskStatus.ASSIGNED) {
      await this.validateStatusChangePermission(task, TaskStatus.ASSIGNED, TaskStatus.DRAFT, userId, orgId);
      const updatedTaskObj = { ...task, status: TaskStatus.DRAFT };
      await this.validateStatusChangePermission(updatedTaskObj, TaskStatus.DRAFT, nextStatus, userId, orgId);

      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.DRAFT }
      });
      await prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: TaskStatus.ASSIGNED,
          toStatus: TaskStatus.DRAFT,
          changedBy: userId
        }
      });
    } else {
      await this.validateStatusChangePermission(task, currentStatus, nextStatus, userId, orgId);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.CLOSED }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        fromStatus: currentStatus,
        toStatus: TaskStatus.CLOSED,
        changedBy: userId
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.STATUS_CHANGED,
      module: "tasks",
      targetId: id,
      targetType: "Task",
      oldValue: { status: currentStatus },
      newValue: { status: TaskStatus.CLOSED },
      req
    });

    return updated;
  }

  static async addComment(id: string, orgId: string, userId: string, body: string, req?: any) {
    const task = await prisma.task.findFirst({
      where: { id, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId,
        body
      }
    });

    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    let match;
    const userIds: string[] = [];

    while ((match = mentionRegex.exec(body)) !== null) {
      userIds.push(match[1]);
    }

    for (const uid of userIds) {
      const user = await prisma.user.findFirst({
        where: { id: uid, isDeleted: false }
      });
      if (user) {
        await NotificationService.notify(
          uid,
          NotificationType.TASK_STATUS_CHANGED,
          "You were mentioned in a comment",
          `You were mentioned in a task comment: "${body.substring(0, 60)}..."`,
          { taskId: id }
        );
      }
    }

    return comment;
  }

  static async listComments(taskId: string, page = 1, limit = 10) {
    const where = { taskId, isDeleted: false };
    const total = await prisma.taskComment.count({ where });
    const comments = await prisma.taskComment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      }
    });

    return { comments, total };
  }

  static async addAttachment(taskId: string, orgId: string, uploadedBy: string, fileUrl: string, fileName: string, fileSize: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    return prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedBy,
        fileUrl,
        fileName,
        fileSize
      }
    });
  }

  static async deleteAttachment(taskId: string, orgId: string, attachId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, isDeleted: false, creator: { organizationId: orgId } }
    });

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    return prisma.taskAttachment.deleteMany({
      where: { id: attachId, taskId }
    });
  }
}

