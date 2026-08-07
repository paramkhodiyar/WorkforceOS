import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.util";

export function requireFeature(featureName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      req.user?.systemRole === "SYS_OWNER" ||
      req.user?.originalRole === "SYS_OWNER" ||
      req.user?.systemRole === "SUPER_ADMIN"
    ) {
      return next();
    }

    if (!req.org) {
      return next(AppError.unauthorized("Authentication required"));
    }

    const enabledFeatures = (req.org as any).enabledFeatures || [];
    if (!enabledFeatures.includes(featureName)) {
      return next(AppError.forbidden(`The feature '${featureName}' is currently disabled for your organization`));
    }

    next();
  };
}
