import app from "./app";
import { config } from "./config/env";
import { logger } from "./config/logger";
import { setupAttendanceCron } from "./jobs/attendance.cron";

const server = app.listen(config.PORT, () => {
  logger.info(`Server started on port ${config.PORT} in ${config.NODE_ENV} mode`);
  setupAttendanceCron().catch((err) => {
    logger.error("Failed to set up attendance cron: " + err.message);
  });
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection: " + (reason?.stack || reason));
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception: " + error.message, { stack: error.stack });
  process.exit(1);
});
export { server };
