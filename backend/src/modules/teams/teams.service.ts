import { prisma } from "../../config/database";
import { AppError } from "../../utils/errors.util";

export class TeamsService {
  static async listTeams(orgId: string, departmentId?: string) {
    const where: any = {
      isDeleted: false,
      department: {
        organizationId: orgId,
        isDeleted: false
      }
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    return prisma.team.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getTeamById(id: string, orgId: string) {
    const team = await prisma.team.findFirst({
      where: {
        id,
        isDeleted: false,
        department: {
          organizationId: orgId,
          isDeleted: false
        }
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true
          }
        }
      }
    });

    if (!team) {
      throw AppError.notFound("Team not found");
    }

    return team;
  }

  static async createTeam(orgId: string, data: { name: string; departmentId: string; leadId?: string | null }) {
    const dept = await prisma.department.findFirst({
      where: { id: data.departmentId, organizationId: orgId, isDeleted: false }
    });

    if (!dept) {
      throw AppError.notFound("Department not found");
    }

    if (data.leadId) {
      const user = await prisma.user.findFirst({
        where: { id: data.leadId, organizationId: orgId, isDeleted: false }
      });
      if (!user) {
        throw AppError.notFound("Lead user not found");
      }
    }

    return prisma.team.create({
      data: {
        name: data.name,
        departmentId: data.departmentId,
        leadId: data.leadId || null
      }
    });
  }

  static async updateTeam(id: string, orgId: string, data: { name?: string; departmentId?: string; leadId?: string | null }) {
    const team = await prisma.team.findFirst({
      where: {
        id,
        isDeleted: false,
        department: {
          organizationId: orgId,
          isDeleted: false
        }
      }
    });

    if (!team) {
      throw AppError.notFound("Team not found");
    }

    if (data.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: data.departmentId, organizationId: orgId, isDeleted: false }
      });
      if (!dept) {
        throw AppError.notFound("Department not found");
      }
    }

    if (data.leadId) {
      const user = await prisma.user.findFirst({
        where: { id: data.leadId, organizationId: orgId, isDeleted: false }
      });
      if (!user) {
        throw AppError.notFound("Lead user not found");
      }
    }

    return prisma.team.update({
      where: { id },
      data: {
        name: data.name ?? team.name,
        departmentId: data.departmentId ?? team.departmentId,
        leadId: data.leadId !== undefined ? data.leadId : team.leadId
      }
    });
  }

  static async deleteTeam(id: string, orgId: string) {
    const team = await prisma.team.findFirst({
      where: {
        id,
        isDeleted: false,
        department: {
          organizationId: orgId,
          isDeleted: false
        }
      }
    });

    if (!team) {
      throw AppError.notFound("Team not found");
    }

    await prisma.team.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  }
}
