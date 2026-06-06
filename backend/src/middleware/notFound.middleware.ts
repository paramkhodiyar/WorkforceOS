import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.util";

export function notFound(req: Request, res: Response, next: NextFunction) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
