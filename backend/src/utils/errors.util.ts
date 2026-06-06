export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(statusCode: number, code: string, message: string, isOperational = true, details?: any) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }

  static unauthorized(message = "Unauthorized access", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }

  static forbidden(message = "Access forbidden", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }

  static badRequest(message = "Bad request", code = "BAD_REQUEST") {
    return new AppError(400, code, message);
  }

  static conflict(message = "Conflict occurred", code = "CONFLICT") {
    return new AppError(409, code, message);
  }

  static unprocessable(message = "Unprocessable entity", details?: any, code = "UNPROCESSABLE_ENTITY") {
    return new AppError(422, code, message, true, details);
  }

  static internal(message = "Internal server error", code = "INTERNAL_SERVER_ERROR") {
    return new AppError(500, code, message, false);
  }
}
