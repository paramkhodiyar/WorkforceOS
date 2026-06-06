import { Request, Response, NextFunction } from "express";

export function auditRead(module: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}
