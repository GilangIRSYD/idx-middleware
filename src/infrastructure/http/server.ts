import { V1Router } from "./routes";
import type { AppLogger } from "../logger/logger";
import { ErrorHandler } from "./errors/error-handler";
import { createRequestMiddleware } from "../logger/middleware";

/**
 * HTTP Server configuration and setup
 */
export interface ServerConfig {
  port: number;
  v1Router: V1Router;
  logger?: AppLogger;
  errorHandler?: ErrorHandler;
}

/**
 * Create and configure the Bun HTTP server
 */
export function createServer(config: ServerConfig) {
  const { port, v1Router, logger, errorHandler } = config;

  // Create request middleware if logger is provided
  const requestMiddleware = logger
    ? createRequestMiddleware(logger, (req) => v1Router.fetch(req))
    : null;

  return Bun.serve({
    port,
    async fetch(req, server) {
      const url = new URL(req.url);

      // Health check (bypass request middleware)
      if (url.pathname === "/health") {
        const now = new Date();
        const isoWIB = now.toISOString().replace("Z", "+07:00");
        return Response.json({
          status: "ok",
          timestamp: isoWIB,
        });
      }

      try {
        // Apply request middleware for API routes
        if (url.pathname.startsWith("/api")) {
          if (requestMiddleware) {
            return requestMiddleware(req, server);
          }
          return v1Router.fetch(req);
        }

        // 404
        return new Response("Not Found", { status: 404 });
      } catch (error) {
        if (errorHandler) {
          return errorHandler.handleError(error);
        }
        // Fallback error handling
        console.error("Unhandled error:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  });
}
