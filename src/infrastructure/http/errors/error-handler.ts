/**
 * Error Handler
 * Converts errors to standardized HTTP responses
 */

import { HttpStatus } from "../../../config";
import { AppError } from "./app-error";
import type { ILogger } from "../../logger/types";

/**
 * Error response formatter
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Error handler class with logger support
 */
export class ErrorHandler {
  constructor(private logger: ILogger) {}

  /**
   * Convert error to standardized response
   */
  errorToResponse(error: unknown): Response {
    if (error instanceof AppError) {
      const body: ErrorResponse = {
        error: error.name,
        message: error.message,
      };
      this.logger.error(`${error.name}: ${error.message}`, error, {
        statusCode: error.statusCode,
        isOperational: error.isOperational,
      });
      return Response.json(body, { status: error.statusCode });
    }

    if (error instanceof Error) {
      const body: ErrorResponse = {
        error: "InternalServerError",
        message: error.message,
      };
      this.logger.error(`Unexpected error: ${error.message}`, error);
      return Response.json(body, { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }

    const body: ErrorResponse = {
      error: "InternalServerError",
      message: "An unknown error occurred",
    };
    this.logger.error("Unknown error type", error);
    return Response.json(body, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }

  /**
   * Handle error in try-catch blocks and return Response
   */
  handleError(error: unknown): Response {
    return this.errorToResponse(error);
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use ErrorHandler class instead
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

/**
 * Legacy function for backward compatibility
 * @deprecated Use ErrorHandler class instead
 */
export function handleError(error: unknown): Response {
  return errorToResponse(error);
}
