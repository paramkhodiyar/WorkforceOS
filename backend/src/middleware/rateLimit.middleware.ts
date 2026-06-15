import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { AppError } from "../utils/errors.util";

export function rateLimit(limit = 100, windowSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const key = `ratelimit:ip:${ip}:${req.method}:${req.originalUrl}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > limit) {
        res.set("Retry-After", String(windowSeconds));
        throw new AppError(429, "TOO_MANY_REQUESTS", "Too many requests, please try again later");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export function rateLimitByUser(limit = 200, windowSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.user?.id || req.ip || req.socket.remoteAddress || "unknown";
      const key = `ratelimit:user:${identifier}:${req.method}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > limit) {
        res.set("Retry-After", String(windowSeconds));
        throw new AppError(429, "TOO_MANY_REQUESTS", "Too many requests, please try again later");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
