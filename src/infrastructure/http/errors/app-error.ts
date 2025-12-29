/**
 * Custom Error Classes
 * Provides typed error handling for the application
 */

import { HttpStatus } from "../../../config";

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to Response object
   */
  toResponse(): Response {
    const body = {
      error: this.name,
      message: this.message,
    };
    console.error(`${this.name}: ${this.message}`);
    return Response.json(body, { status: this.statusCode });
  }

  /**
   * Static method to create a 400 Bad Request error
   */
  static badRequest(message: string): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST);
  }

  /**
   * Static method to create a 401 Unauthorized error
   */
  static unauthorized(message: string = "Unauthorized"): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED);
  }

  /**
   * Static method to create a 403 Forbidden error
   */
  static forbidden(message: string = "Forbidden"): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN);
  }

  /**
   * Static method to create a 404 Not Found error
   */
  static notFound(resource: string, identifier?: string): AppError {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    return new AppError(message, HttpStatus.NOT_FOUND);
  }

  /**
   * Static method to create a 500 Internal Server error
   */
  static internal(message: string): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * Static method to create a 503 Service Unavailable error
   */
  static serviceUnavailable(message: string = "Service unavailable"): AppError {
    return new AppError(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
    this.name = "ValidationError";
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

/**
 * API error for external API failures
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly originalError?: unknown,
    public readonly statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(message, statusCode);
    this.name = "ApiError";
  }
}
