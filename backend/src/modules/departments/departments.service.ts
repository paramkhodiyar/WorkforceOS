import { prisma } from "../../config/database";
import { AppError } from "../../utils/errors.util";

export class DepartmentsService {
  static async listDepartments(orgId: string) {
    return prisma.department.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false
      },
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            employees: true,
            teams: {
              where: { isDeleted: false }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getDepartmentById(id: string, orgId: string) {
    const dept = await prisma.department.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teams: {
          where: { isDeleted: false }
        },
        employees: {
          where: { isDeleted: false },
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

    if (!dept) {
      throw AppError.notFound("Department not found");
    }

    return dept;
  }

  static async createDepartment(orgId: string, data: { name: string; headId?: string | null }) {
    if (data.headId) {
      const user = await prisma.user.findFirst({
        where: { id: data.headId, organizationId: orgId, isDeleted: false }
      });
      if (!user) {
        throw AppError.notFound("Head user not found");
      }
    }

    return prisma.department.create({
      data: {
        name: data.name,
        organizationId: orgId,
        headId: data.headId || null
      }
    });
  }

  static async updateDepartment(id: string, orgId: string, data: { name?: string; headId?: string | null; employeeIds?: string[] }) {
    const dept = await prisma.department.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!dept) {
      throw AppError.notFound("Department not found");
    }

    if (data.headId) {
      const user = await prisma.user.findFirst({
        where: { id: data.headId, organizationId: orgId, isDeleted: false }
      });
      if (!user) {
        throw AppError.notFound("Head user not found");
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        name: data.name ?? dept.name,
        headId: data.headId !== undefined ? data.headId : dept.headId,
        employees: data.employeeIds ? {
          set: data.employeeIds.map((id) => ({ id }))
        } : undefined
      }
    });
  }

  static async deleteDepartment(id: string, orgId: string) {
    const dept = await prisma.department.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!dept) {
      throw AppError.notFound("Department not found");
    }

    await prisma.department.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  }
}
