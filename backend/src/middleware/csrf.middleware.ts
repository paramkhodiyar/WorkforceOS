import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config/env";

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  next();
}
