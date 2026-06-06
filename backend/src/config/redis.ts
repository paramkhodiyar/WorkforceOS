import Redis from "ioredis";
import { config } from "./env";
import { logger } from "./logger";

export const redis = new Redis(config.REDIS_URL);

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

redis.on("error", (err) => {
  logger.error("Redis Connection Error: " + err.message);
});
