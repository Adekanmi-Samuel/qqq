/**
 * Standardized Application Error Classes
 *
 * Each error class carries: code, message, statusCode, details.
 * Use these throughout the application for consistent error handling.
 */

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number, code: string = "INTERNAL_ERROR", details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: any) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

// 401 - Authentication Required
export class AuthRequiredError extends AppError {
  constructor(message: string = "Authentication required. Please sign in.") {
    super(message, 401, "AUTH_REQUIRED");
  }
}

// Keep backward compatibility
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = "You don't have permission to perform this action.") {
    super(message, 403, "FORBIDDEN");
  }
}

// 404 - Resource Not Found
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "RESOURCE_NOT_FOUND");
  }
}

// 402 - Payment Failed
export class PaymentFailedError extends AppError {
  constructor(message: string = "Payment processing failed", details?: any) {
    super(message, 402, "PAYMENT_FAILED", details);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists", details?: any) {
    super(message, 409, "CONFLICT", details);
  }
}

// 422 - Validation Error
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: any) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

// 429 - Rate Limited
export class RateLimitedError extends AppError {
  public retryAfter: number; // seconds

  constructor(message: string = "Too many requests. Please try again later.", retryAfter: number = 60) {
    super(message, 429, "RATE_LIMITED");
    this.retryAfter = retryAfter;
  }
}

// 500 - Internal Server Error
export class ServerError extends AppError {
  constructor(message: string = "An unexpected error occurred. Please try again later.") {
    super(message, 500, "SERVER_ERROR");
  }
}

// 503 - Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service temporarily unavailable. Please try again later.") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}
