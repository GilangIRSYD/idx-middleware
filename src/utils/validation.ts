/**
 * Validation Utilities
 * Common validation functions for input data
 */

import { ValidationError } from "../infrastructure/http/errors";

/**
 * Date validation utilities
 */
export class DateValidator {
  /**
   * Validate date string in YYYY-MM-DD format
   */
  static isValidDateString(dateString: string): boolean {
    if (!dateString || typeof dateString !== "string") {
      return false;
    }

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate that from date is before to date
   */
  static isDateRangeValid(from: string, to: string): boolean {
    if (!this.isValidDateString(from) || !this.isValidDateString(to)) {
      return false;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    return fromDate <= toDate;
  }

  /**
   * Throw ValidationError if date is invalid
   */
  static validateDate(dateString: string, fieldName: string = "date"): void {
    if (!this.isValidDateString(dateString)) {
      throw new ValidationError(
        `Invalid ${fieldName}. Expected format: YYYY-MM-DD (e.g., 2024-01-15)`
      );
    }
  }

  /**
   * Throw ValidationError if date range is invalid
   */
  static validateDateRange(from: string, to: string): void {
    this.validateDate(from, "from date");
    this.validateDate(to, "to date");

    if (!this.isDateRangeValid(from, to)) {
      throw new ValidationError("'from' date must be before or equal to 'to' date");
    }
  }
}

/**
 * String validation utilities
 */
export class StringValidator {
  /**
   * Validate that a string is not empty or just whitespace
   */
  static isNonEmptyString(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
  }

  /**
   * Throw ValidationError if string is empty
   */
  static validateNonEmpty(value: unknown, fieldName: string = "value"): void {
    if (!this.isNonEmptyString(value)) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }
  }
}

/**
 * Broker code validation
 */
export class BrokerValidator {
  /**
   * Validate broker code format
   * Assumes broker codes are alphanumeric (e.g., "BB", "YU")
   */
  static isValidBrokerCode(code: string): boolean {
    return /^[A-Za-z0-9]+$/.test(code) && code.length >= 2;
  }

  /**
   * Throw ValidationError if broker code is invalid
   */
  static validateBrokerCode(code: string): void {
    StringValidator.validateNonEmpty(code, "Broker code");

    if (!this.isValidBrokerCode(code)) {
      throw new ValidationError(
        "Invalid broker code format. Must be alphanumeric and at least 2 characters"
      );
    }
  }
}

/**
 * Emiten/Stock symbol validation
 */
export class EmitenValidator {
  /**
   * Validate emiten symbol format
   * Assumes emiten symbols are 4-letter uppercase codes (e.g., "BBCA", "DEWA")
   */
  static isValidSymbol(symbol: string): boolean {
    return /^[A-Z]{4}$/.test(symbol);
  }

  /**
   * Throw ValidationError if symbol is invalid
   */
  static validateSymbol(symbol: string): void {
    StringValidator.validateNonEmpty(symbol, "Symbol");

    if (!this.isValidSymbol(symbol)) {
      throw new ValidationError(
        "Invalid symbol format. Must be 4 uppercase letters (e.g., BBCA, DEWA)"
      );
    }
  }
}
