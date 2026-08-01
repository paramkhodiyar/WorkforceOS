import { Request, Response } from "express";
import { prisma } from "../../config/database";
import { redis } from "../../config/redis";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // 1. Database Check
  let dbStatus = "HEALTHY";
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = "UNHEALTHY";
  }

  // 2. Redis Check
  let redisStatus = "HEALTHY";
  let redisLatencyMs = 0;
  try {
    const redisStart = Date.now();
    await redis.ping();
    redisLatencyMs = Date.now() - redisStart;
  } catch (err) {
    redisStatus = "UNHEALTHY";
  }

  const overallStatus = dbStatus === "HEALTHY" && redisStatus === "HEALTHY" ? "HEALTHY" : "DEGRADED";

  const healthInfo = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    memoryUsageMB: {
      rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
    },
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs
      }
    },
    responseTimeMs: Date.now() - startTime
  };

  const statusCode = overallStatus === "HEALTHY" ? 200 : 503;
  return res.status(statusCode).json({
    success: overallStatus === "HEALTHY",
    data: healthInfo
  });
});
