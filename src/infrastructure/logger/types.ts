/**
 * Log levels in order of severity
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  levelName: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    statusCode?: number;
    isOperational?: boolean;
  };
  requestId?: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  pretty: boolean;
  includeTimestamp: boolean;
  includeStackTrace: boolean;
}

/**
 * Logger interface
 */
export interface ILogger {
  trace(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void;
  setRequestId(requestId: string): void;
  clearRequestId(): void;
  withContext(context: Record<string, unknown>): ILogger;
}
