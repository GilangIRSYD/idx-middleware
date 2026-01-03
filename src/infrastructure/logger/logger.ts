import type { ILogger, LogEntry, LoggerConfig } from "./types";
import { LogLevel } from "./types";

/**
 * Timezone configuration
 */
const TIMEZONE = "Asia/Jakarta"; // WIB (UTC+7)
const TIMEZONE_OFFSET = "+07:00";

/**
 * Format timestamp to WIB timezone
 * Returns ISO 8601 format with timezone offset: 2025-12-31T17:30:45.123+07:00
 */
function formatTimestamp(date: Date): string {
  // Get ISO string and replace 'Z' with WIB offset
  const isoString = date.toISOString();
  return isoString.replace("Z", TIMEZONE_OFFSET);
}

/**
 * Format timestamp for pretty print
 * Returns: 31-12-2025 17:30:45 WIB
 */
function formatPrettyTimestamp(date: Date): string {
  // Convert to WIB
  const wibDate = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));

  const day = String(wibDate.getDate()).padStart(2, "0");
  const month = String(wibDate.getMonth() + 1).padStart(2, "0");
  const year = wibDate.getFullYear();

  const hours = String(wibDate.getHours()).padStart(2, "0");
  const minutes = String(wibDate.getMinutes()).padStart(2, "0");
  const seconds = String(wibDate.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} WIB`;
}

/**
 * Parse log level from string or env
 */
function parseLogLevel(level: string | undefined): LogLevel {
  const levels: Record<string, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  };
  return levels[level?.toLowerCase() ?? "info"] ?? LogLevel.INFO;
}

/**
 * Get default logger config based on environment
 */
function getDefaultConfig(): LoggerConfig {
  const isDevelopment = process.env.NODE_ENV !== "production";
  return {
    level: parseLogLevel(process.env.LOG_LEVEL),
    // pretty: isDevelopment, 
    pretty: true, 
    includeTimestamp: true,
    includeStackTrace: isDevelopment,
  };
}

/**
 * AppLogger - Structured logger for Bun applications
 *
 * Features:
 * - Multiple log levels (trace, debug, info, warn, error)
 * - Structured JSON logging for production
 * - Pretty print for development
 * - Request ID tracking
 * - Context support
 */
export class AppLogger implements ILogger {
  private config: LoggerConfig;
  private currentRequestId?: string;
  private baseContext: Record<string, unknown> = {};

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...getDefaultConfig(), ...config };
  }

  /**
   * Set request ID for the current request context
   */
  setRequestId(requestId: string): void {
    this.currentRequestId = requestId;
  }

  /**
   * Clear the current request ID
   */
  clearRequestId(): void {
    this.currentRequestId = undefined;
  }

  /**
   * Create a new logger instance with additional context
   */
  withContext(context: Record<string, unknown>): ILogger {
    const logger = new AppLogger(this.config);
    logger.baseContext = { ...this.baseContext, ...context };
    logger.currentRequestId = this.currentRequestId;
    return logger;
  }

  trace(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext = this.buildErrorContext(error);
    const mergedContext = { ...context, ...errorContext };
    this.log(LogLevel.ERROR, message, mergedContext, error as Error);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    // Skip if level is below configured threshold
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      levelName: LogLevel[level],
      message,
      timestamp: this.config.includeTimestamp ? formatTimestamp(new Date()) : "",
      context: { ...this.baseContext, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined,
      };
    }

    // Add type-safe error properties
    if (error && typeof error === "object" && error !== null) {
      const err = error as unknown as Record<string, unknown>;
      if (entry.error) {
        entry.error.statusCode = err.statusCode as number | undefined;
        entry.error.isOperational = err.isOperational as boolean | undefined;
      }
    }

    if (this.currentRequestId) {
      entry.requestId = this.currentRequestId;
    }

    this.output(entry);
  }

  /**
   * Build error context from error object
   */
  private buildErrorContext(error?: Error | unknown): Record<string, unknown> {
    if (!error) return {};

    if (error instanceof Error) {
      return {
        errorName: error.name,
        errorMessage: error.message,
      };
    }

    if (typeof error === "object" && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        errorName: (err.name as string) ?? "UnknownError",
        errorMessage: (err.message as string) ?? String(error),
        statusCode: err.statusCode,
        isOperational: err.isOperational,
      };
    }

    return { errorMessage: String(error) };
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    const output = this.formatOutput(entry);

    // Write to stderr for errors, stdout for everything else
    if (entry.level >= LogLevel.ERROR) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Format log entry for output
   */
  private formatOutput(entry: LogEntry): string {
    if (this.config.pretty) {
      return this.formatPretty(entry);
    }
    return JSON.stringify(entry);
  }

  /**
   * Format log entry as pretty print (development)
   * Format: [LEVEL] TIMESTAMP WIB [REQUEST_ID] MESSAGE
   */
  private formatPretty(entry: LogEntry): string {
    const colors = {
      [LogLevel.TRACE]: "\x1b[90m", // gray
      [LogLevel.DEBUG]: "\x1b[36m", // cyan
      [LogLevel.INFO]: "\x1b[32m",  // green
      [LogLevel.WARN]: "\x1b[33m",  // yellow
      [LogLevel.ERROR]: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";

    const levelColor = colors[entry.level] ?? reset;
    const levelName = entry.levelName;
    const timestamp = entry.timestamp ? formatPrettyTimestamp(new Date()) : "";
    const requestId = entry.requestId ? ` [${entry.requestId}]` : "";

    let output = `${levelColor}[${levelName}]${reset} [${timestamp}]${requestId} ${entry.message}`;

    // Add context
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context, null, 2);
      output += `\n${this.indent(contextStr)}`;
    }

    // Add error details
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n${this.indent(entry.error.stack)}`;
      }
    }

    return output;
  }

  /**
   * Indent multi-line output
   */
  private indent(str: string): string {
    return str.split("\n").map((line) => `  ${line}`).join("\n");
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

/**
 * Create a singleton logger instance
 */
let globalLogger: AppLogger | null = null;

export function createLogger(config?: Partial<LoggerConfig>): AppLogger {
  if (!globalLogger) {
    globalLogger = new AppLogger(config);
  }
  return globalLogger;
}

export function getLogger(): AppLogger {
  if (!globalLogger) {
    globalLogger = new AppLogger();
  }
  return globalLogger;
}
