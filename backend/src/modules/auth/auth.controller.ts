import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "../../utils/response.util";
import { prisma } from "../../config/database";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password, req);
  return sendSuccess(res, result);
});

export const registerTrial = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.registerTrial(req.body, req);
  return sendSuccess(res, result, "Trial account registered and initialized successfully");
});

export const switchRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  const userId = req.user!.id;
  const result = await AuthService.switchRole(userId, role, req.user!);
  return sendSuccess(res, result, "Role simulated successfully");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await AuthService.refresh(refreshToken);
  return sendSuccess(res, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const userId = req.user!.id;
  const orgId = req.org!.id;
  await AuthService.logout(refreshToken, userId, orgId, req);
  return sendSuccess(res, null, "Logged out successfully");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { id: req.user!.id, isDeleted: false },
    include: {
      department: true,
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true
        }
      },
      roles: {
        include: {
          role: true
        }
      },
      departmentHead: {
        where: { isDeleted: false },
        select: { id: true, name: true }
      },
      teamLead: {
        where: { isDeleted: false },
        select: { id: true, name: true }
      },
      teams: {
        where: { isDeleted: false },
        select: { id: true, name: true }
      }
    }
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  const formattedRoles = user.roles.map((ur) => ({
    roleId: ur.roleId,
    roleName: ur.role.name,
    scopeType: ur.scopeType,
    scopeId: ur.scopeId
  }));

  const userProfile = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    employeeId: user.employeeId,
    designation: user.designation,
    salaryBand: user.salaryBand,
    joinDate: user.joinDate,
    status: user.status,
    systemRole: req.user!.systemRole || user.systemRole,
    originalRole: req.user!.originalRole,
    department: user.department,
    manager: user.manager,
    organizationId: user.organizationId,
    roles: formattedRoles,
    departmentHead: user.departmentHead,
    teamLead: user.teamLead,
    teams: user.teams,
    forcePasswordChange: user.forcePasswordChange,
    address: user.address,
    homeLatitude: user.homeLatitude,
    homeLongitude: user.homeLongitude,
    homeRadius: user.homeRadius,
    homeAddressLocked: user.homeAddressLocked
  };

  return sendSuccess(res, userProfile);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const { oldPassword, newPassword } = req.body;
  await AuthService.changePassword(userId, orgId, oldPassword, newPassword, req);
  return sendSuccess(res, null, "Password updated successfully");
});

export const getAdminContact = asyncHandler(async (req: Request, res: Response) => {
  const adminUser = await prisma.user.findFirst({
    where: {
      systemRole: "SUPER_ADMIN",
      isDeleted: false
    },
    select: {
      email: true
    }
  });
  return sendSuccess(res, {
    email: adminUser?.email || "superadmin@workforceos.com"
  });
});
