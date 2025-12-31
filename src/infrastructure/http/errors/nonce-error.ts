/**
 * Nonce-related Error Classes
 * Provides typed error handling for nonce validation and replay attack prevention
 */

import { AppError } from "./app-error";
import { HttpStatus } from "../../../config";

/**
 * Base nonce error for invalid nonce-related issues
 */
export class NonceError extends AppError {
  constructor(message: string = "Invalid or reused nonce") {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = "NonceError";
  }
}

/**
 * Error thrown when a duplicate nonce is detected (replay attack)
 */
export class DuplicateNonceError extends AppError {
  constructor(nonce: string) {
    super(`Nonce already used: ${nonce}`, HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = "DuplicateNonceError";
  }
}

/**
 * Error thrown when X-Nonce header is missing
 */
export class MissingNonceError extends AppError {
  constructor() {
    super("X-Nonce header is required", HttpStatus.BAD_REQUEST);
    this.name = "MissingNonceError";
  }
}
