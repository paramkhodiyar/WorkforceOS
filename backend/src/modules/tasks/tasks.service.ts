import { prisma } from "../../config/database";
import { TaskStatus, TaskPriority, AuditAction, NotificationType } from "@prisma/client";
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

  static async createTask(
    orgId: string,
    creatorId: string,
    data: { title: string; description?: string; assigneeId?: string; priority?: TaskPriority; dueDate?: Date; parentTaskId?: string; dependencies?: string[] },
    req?: any
  ) {
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

    const status = data.assigneeId ? TaskStatus.ASSIGNED : TaskStatus.DRAFT;

    const task = await prisma.task.create({
      data: {
        taskId,
        title: data.title,
        description: data.description,
        creatorId,
        assigneeId: data.assigneeId || null,
        status,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        parentTaskId: data.parentTaskId || null
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

      const conditions: any[] = [
        { creatorId: user.id },
        { assigneeId: user.id }
      ];

      if (departmentIds.length > 0) {
        conditions.push({ assignee: { departmentId: { in: departmentIds } } });
      }
      if (teamIds.length > 0) {
        conditions.push({ assignee: { teams: { some: { id: { in: teamIds } } } } });
      }

      // Add extra filters if specified and authorized by scope
      const userDeptId = user.departmentId;
      const userTeams = await prisma.team.findMany({
        where: { members: { some: { id: user.id } }, isDeleted: false },
        select: { id: true }
      });
      const memberTeamIds = userTeams.map((t) => t.id);

      if (filters.teamId && (teamIds.includes(filters.teamId) || memberTeamIds.includes(filters.teamId))) {
        conditions.push({ assignee: { teams: { some: { id: filters.teamId } } } });
      }
      if (filters.departmentId && (departmentIds.includes(filters.departmentId) || userDeptId === filters.departmentId)) {
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
      if (!isCreatorOrAssignee) {
        const assignedScopes = await getPermissionScopes(user, orgId, "task", "read:assigned");
        const createdScopes = await getPermissionScopes(user, orgId, "task", "read:created");
        
        const departmentIds = Array.from(new Set([...assignedScopes.departmentIds, ...createdScopes.departmentIds]));
        const teamIds = Array.from(new Set([...assignedScopes.teamIds, ...createdScopes.teamIds]));

        const isDeptHeadOfAssignee = task.assignee?.departmentId && departmentIds.includes(task.assignee.departmentId);
        const isTeamLeadOfAssignee = task.assignee?.teams && task.assignee.teams.some(t => teamIds.includes(t.id));

        if (!isDeptHeadOfAssignee && !isTeamLeadOfAssignee) {
          throw AppError.forbidden("Access denied: you do not have permission to view this task");
        }
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

    if (data.status && data.status !== task.status) {
      this.validateStateTransition(task.status, data.status);

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
    if (task.status !== TaskStatus.DRAFT && task.status !== TaskStatus.ASSIGNED) {
      this.validateStateTransition(task.status, newStatus);
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

    this.validateStateTransition(task.status, TaskStatus.ACCEPTED);

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

    if (currentStatus === TaskStatus.ACCEPTED) {
      await prisma.task.update({
        where: { id },
        data: { status: TaskStatus.IN_PROGRESS }
      });
      this.validateStateTransition(TaskStatus.IN_PROGRESS, nextStatus);
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
      this.validateStateTransition(currentStatus, nextStatus);
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

    this.validateStateTransition(task.status, TaskStatus.IN_REVIEW);

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

    const nextStatus = action === "APPROVED" ? TaskStatus.APPROVED : TaskStatus.CHANGES_REQUESTED;
    this.validateStateTransition(TaskStatus.IN_REVIEW, nextStatus);

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

    this.validateStateTransition(task.status, TaskStatus.RESUBMITTED);

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

    this.validateStateTransition(task.status, TaskStatus.CLOSED);

    const updated = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.CLOSED }
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: id,
        fromStatus: task.status,
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
      oldValue: { status: task.status },
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
