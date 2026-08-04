import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "../../utils/response.util";
import { prisma } from "../../config/database";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";
import { verifyToken } from "../../utils/token.util";
import { config } from "../../config/env";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password, req);

  const { accessToken, refreshToken } = result.tokens;
  const isProd = config.NODE_ENV === "production" || process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const responseBody = { ...result };

  return sendSuccess(res, responseBody);
});

export const registerTrial = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.registerTrial(req.body, req);
  
  // Set cookies for immediate auto-login
  const { accessToken, refreshToken } = result.tokens;
  const isProd = config.NODE_ENV === "production" || process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const responseBody = { ...result };

  return sendSuccess(res, responseBody, "Trial account registered and initialized successfully");
});

export const switchRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  const userId = req.user!.id;
  const result = await AuthService.switchRole(userId, role, req.user!);

  const { accessToken, refreshToken } = result.tokens;
  const isProd = config.NODE_ENV === "production" || process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const responseBody = { ...result };

  return sendSuccess(res, responseBody, "Role simulated successfully");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    throw AppError.unauthorized("Refresh token required");
  }

  const result = await AuthService.refresh(refreshToken);
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = result;
  const isProd = config.NODE_ENV === "production" || process.env.NODE_ENV === "production";

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const responseBody = { ...result };

  return sendSuccess(res, responseBody);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const userId = req.user!.id;
  const orgId = req.org!.id;
  
  if (refreshToken) {
    await AuthService.logout(refreshToken, userId, orgId, req);
  }

  const isProd = config.NODE_ENV === "production" || process.env.NODE_ENV === "production";
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax"
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax"
  });

  return sendSuccess(res, null, "Logged out successfully");
});

export const cookieExchange = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = req.body;
  if (!accessToken || !refreshToken) {
    throw AppError.badRequest("Access token and refresh token are required");
  }

  try {
    verifyToken(refreshToken, config.JWT_REFRESH_SECRET);
  } catch (err) {
    throw AppError.unauthorized("Invalid refresh token");
  }

  const isProd = config.NODE_ENV === "production" || process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return sendSuccess(res, null, "Cookies set successfully");
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
          role: {
            include: {
              permissions: true
            }
          }
        }
      },
      organization: true,
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

  const allPermissions = new Set<string>();
  const permissionObjects: Array<{ resource: string; action: string }> = [];

  user.roles.forEach((ur: any) => {
    if (ur.role?.permissions) {
      ur.role.permissions.forEach((p: any) => {
        allPermissions.add(`${p.resource}:${p.action}`);
        permissionObjects.push({ resource: p.resource, action: p.action });
      });
    }
  });

  const formattedRoles = user.roles.map((ur: any) => ({
    roleId: ur.roleId,
    roleName: ur.role.name,
    scopeType: ur.scopeType,
    scopeId: ur.scopeId,
    permissions: ur.role.permissions ? ur.role.permissions.map((p: any) => ({ resource: p.resource, action: p.action })) : []
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
    organization: user.organization,
    roles: formattedRoles,
    permissions: Array.from(allPermissions),
    permissionObjects,
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

export const dismissWelcome = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const updated = await AuthService.dismissWelcome(userId);
  return sendSuccess(res, updated, "Welcome popup dismissed permanently.");
});
