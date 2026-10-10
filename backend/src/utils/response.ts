import { Response } from "express";

/**
 * Standardized API Response Format
 *
 * Success: { success: true, data: T, meta?: { page, limit, total, totalPages } }
 * Error: { success: false, error: { code: string, message: string, details?: any, requestId?: string } }
 */

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
}

/**
 * Send a successful response.
 */
export function sendSuccess<T>(res: Response, data: T, meta?: PaginationMeta): void {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  };
  if (meta) {
    body.meta = meta;
  }
  res.json(body);
}

/**
 * Send a successful response with a custom message.
 */
export function sendSuccessWithMessage<T>(res: Response, data: T, message: string): void {
  res.json({
    success: true,
    data,
    message,
  } as SuccessResponse<T>);
}

/**
 * Send a successful response with a message and no data payload.
 */
export function sendMessage(res: Response, message: string): void {
  res.json({
    success: true,
    data: null,
    message,
  });
}

/**
 * Send an error response.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any,
  requestId?: string
): void {
  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details) {
    body.error.details = details;
  }
  if (requestId) {
    body.error.requestId = requestId;
  }
  res.status(statusCode).json(body);
}

/**
 * Send a paginated success response.
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): void {
  const totalPages = Math.ceil(total / limit);
  res.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}
