import { prisma } from "../../config/database";
import { comparePassword, hashPassword } from "../../utils/hash.util";
import { signAccessToken, signRefreshToken, verifyToken } from "../../utils/token.util";
import { config } from "../../config/env";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@prisma/client";
import { redis } from "../../config/redis";

export class AuthService {
  static async login(email: string, password: string, req?: any) {
    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || user.status !== "ACTIVE") {
      throw AppError.unauthorized("Invalid credentials");
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      organizationId: user.organizationId
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    });

    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      action: AuditAction.LOGIN,
      module: "auth",
      req
    });

    const formattedRoles = user.roles.map((ur) => ({
      roleId: ur.roleId,
      roleName: ur.role.name,
      scopeType: ur.scopeType,
      scopeId: ur.scopeId
    }));

    return {
      tokens: { accessToken, refreshToken },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
        organizationId: user.organizationId,
        roles: formattedRoles,
        forcePasswordChange: user.forcePasswordChange
      }
    };
  }

  static async refresh(token: string) {
    let decoded;
    try {
      decoded = verifyToken(token, config.JWT_REFRESH_SECRET);
    } catch (err) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      throw AppError.unauthorized("Refresh token is expired or revoked");
    }

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true }
    });

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, isDeleted: false }
    });

    if (!user || user.status !== "ACTIVE") {
      throw AppError.unauthorized("User account is inactive or not found");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
      organizationId: user.organizationId
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt
      }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  static async logout(token: string, userId: string, orgId: string, req?: any) {
    await prisma.refreshToken.updateMany({
      where: { token, userId },
      data: { isRevoked: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.LOGOUT,
      module: "auth",
      req
    });
  }

  static async changePassword(userId: string, orgId: string, oldPass: string, newPass: string, req?: any) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false }
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const matches = await comparePassword(oldPass, user.passwordHash);
    if (!matches) {
      throw AppError.badRequest("Invalid current password");
    }

    const passwordHash = await hashPassword(newPass);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash,
        forcePasswordChange: false
      }
    });

    await redis.del(`user:session:${userId}`).catch(() => {});

    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: userId,
      action: AuditAction.UPDATED,
      module: "auth",
      targetId: userId,
      targetType: "User",
      newValue: { passwordChanged: true },
      req
    });

    return updatedUser;
  }
}
