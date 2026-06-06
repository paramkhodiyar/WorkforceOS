import app from "./app";
import { config } from "./config/env";
import { logger } from "./config/logger";

const server = app.listen(config.PORT, () => {
  logger.info(`Server started on port ${config.PORT} in ${config.NODE_ENV} mode`);
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection: " + (reason?.stack || reason));
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception: " + error.message, { stack: error.stack });
  process.exit(1);
});
export { server };
