import { Response } from "express";

export function sendSuccess<T = any>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
}

export function sendPaginated<T = any>(
  res: Response,
  data: T[],
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
}

export function sendError(
  res: Response,
  payload: {
    code: string;
    message: string;
    details?: any;
    statusCode?: number;
  }
) {
  const statusCode = payload.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: payload.code,
      message: payload.message,
      details: payload.details
    }
  });
}
