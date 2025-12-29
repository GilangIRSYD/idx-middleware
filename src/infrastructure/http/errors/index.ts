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

/**
 * Error response formatter
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Convert error to standardized response
 */
export function errorToResponse(error: unknown): Response {
  if (error instanceof AppError) {
    const body: ErrorResponse = {
      error: error.name,
      message: error.message,
    };
    console.error(`${error.name}: ${error.message}`);
    return Response.json(body, { status: error.statusCode });
  }

  if (error instanceof Error) {
    const body: ErrorResponse = {
      error: "InternalServerError",
      message: error.message,
    };
    console.error(`Unexpected error: ${error.message}`);
    return Response.json(body, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }

  const body: ErrorResponse = {
    error: "InternalServerError",
    message: "An unknown error occurred",
  };
  console.error("Unknown error type:", error);
  return Response.json(body, { status: HttpStatus.INTERNAL_SERVER_ERROR });
}
