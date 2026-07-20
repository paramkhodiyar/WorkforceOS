import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config/env";

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // 1. Get or set the CSRF token in the cookies
  let csrfToken = req.cookies.csrfToken;
  const isProd = config.NODE_ENV === "production" || process.env.NODE_ENV === "production";

  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString("hex");
    res.cookie("csrfToken", csrfToken, {
      httpOnly: false, // Must be readable by client JS
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
  }

  // 2. Verify CSRF token for state-changing requests
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (stateChangingMethods.includes(req.method)) {
    const headerToken = req.headers["x-csrf-token"];
    
    if (!headerToken || headerToken !== csrfToken) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "CSRF token validation failed."
        }
      });
      return;
    }
  }

  next();
}
