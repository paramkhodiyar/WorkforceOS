import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { AppError } from "../utils/errors.util";

/**
 * Atomic Lua script: increments the counter and sets the TTL in a single
 * Redis round-trip. Using Lua guarantees the EXPIRE is always applied even
 * if the process crashes between an INCR and a subsequent EXPIRE call.
 * The EXPIRE is only set when current === 1 (first request in window) so
 * later increments within the same window don't reset the TTL.
 */
const RATE_LIMIT_SCRIPT = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return current
`;

async function atomicIncr(key: string, windowSeconds: number): Promise<number> {
  const result = await redis.eval(RATE_LIMIT_SCRIPT, 1, key, String(windowSeconds));
  return result as number;
}

export function rateLimit(limit = 100, windowSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const key = `ratelimit:ip:${ip}:${req.method}:${req.originalUrl}`;

      const current = await atomicIncr(key, windowSeconds);

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
  const effectiveLimit = process.env.NODE_ENV === "development" ? 2000 : limit;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.user?.id || req.ip || req.socket.remoteAddress || "unknown";
      const key = `ratelimit:user:${identifier}:${req.method}`;

      const current = await atomicIncr(key, windowSeconds);

      if (current > effectiveLimit) {
        res.set("Retry-After", String(windowSeconds));
        throw new AppError(429, "TOO_MANY_REQUESTS", "Too many requests, please try again later");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
