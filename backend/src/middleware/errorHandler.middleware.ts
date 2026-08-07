import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.util";
import { sendError } from "../utils/response.util";
import { logger } from "../config/logger";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = "VALIDATION_FAILED";
    message = "Validation failed";
    details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message
    }));
  } else if (err.code && typeof err.code === "string" && err.code.startsWith("P")) {
    logger.error(`Database Error [${err.code}]: ${err.message}`, { meta: err.meta });
    if (err.code === "P2002") {
      statusCode = 409;
      code = "CONFLICT";
      message = "Unique constraint failed: record already exists";
    } else if (err.code === "P2025") {
      statusCode = 404;
      code = "NOT_FOUND";
      message = "Record not found";
    } else {
      statusCode = 400;
      code = `DATABASE_ERROR_${err.code}`;
      message = process.env.NODE_ENV === "development" ? `Database operation failed: ${err.message}` : "Database operation failed";
    }
    details = process.env.NODE_ENV === "production" ? undefined : (err.meta || err.message);
  } else {
    logger.error("Unhandled error: " + err.message, { stack: err.stack });
    if (process.env.NODE_ENV === "development") {
      message = err.message;
      details = err.stack;
    }
  }

  return sendError(res, {
    code,
    message,
    details,
    statusCode
  });
}
