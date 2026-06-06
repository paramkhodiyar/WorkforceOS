import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";
import { softDeleteMiddleware } from "../middleware/softDelete.middleware";

export const prisma = new PrismaClient();

prisma.$use(softDeleteMiddleware);

prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  if (duration > 500) {
    logger.warn(`Slow query: ${params.model || "Database"}.${params.action} took ${duration}ms`);
  }

  return result;
});
