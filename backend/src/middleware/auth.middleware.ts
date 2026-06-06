import { Request, Response, NextFunction } from "express";
  import { verifyToken } from "../utils/token.util";
  import { config } from "../config/env";
  import { prisma } from "../config/database";
  import { AppError } from "../utils/errors.util";

  export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw AppError.unauthorized("Authentication token required");
      }
      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = verifyToken(token, config.JWT_ACCESS_SECRET);
      } catch (err) {
        throw AppError.unauthorized("Invalid or expired authentication token");
      }

      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          isDeleted: false
        },
        include: {
          roles: {
            include: {
              role: true
            }
          },
          organization: true
        }
      });

      if (!user) {
        throw AppError.unauthorized("User account not found");
      }

      if (user.status !== "ACTIVE") {
        throw AppError.unauthorized("User account is inactive or suspended");
      }

      const formattedRoles = user.roles.map((ur) => ({
        roleId: ur.roleId,
        roleName: ur.role.name,
        scopeType: ur.scopeType,
        scopeId: ur.scopeId
      }));

      req.user = {
        ...user,
        roles: formattedRoles
      } as any;

      req.org = user.organization;

      next();
    } catch (error) {
      next(error);
    }
  }
