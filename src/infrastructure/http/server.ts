import { V1Router } from "./routes";
import type { AppLogger } from "../logger/logger";
import { ErrorHandler } from "./errors/error-handler";
import { createRequestMiddleware } from "../logger/middleware";
import type { IInMemoryStorageWithTTL } from "../../domain/storage/storage.interface";
import { createMiddlewareChain, type MiddlewareDependencies } from "./middleware/middleware-runner";
import { createNonceMiddleware } from "./middleware/nonce-check.middleware";
import { createCorsMiddleware } from "./middleware/cors-middleware";

/**
 * HTTP Server configuration and setup
 */
export interface ServerConfig {
  port: number;
  v1Router: V1Router;
  logger?: AppLogger;
  errorHandler?: ErrorHandler;
  nonceStorage?: IInMemoryStorageWithTTL<{ timestamp: number; path: string; method: string; ip: string }, string>;
}

/**
 * Create and configure the Bun HTTP server
 */
export function createServer(config: ServerConfig) {
  const { port, v1Router, logger, errorHandler, nonceStorage } = config;

  // Nonce TTL configuration (5 minutes)
  const NONCE_TTL = 5 * 60 * 1000;

  // Middleware dependencies
  const deps: MiddlewareDependencies = {
    logger,
    nonceStorage,
  };

  // Create base request handler (router)
  const baseHandler = (req: Request) => v1Router.fetch(req);

  // Create request logging middleware (wrap base handler)
  const requestMiddleware = logger
    ? createRequestMiddleware(logger, baseHandler)
    : baseHandler;

  // Configure middleware chain (add new middleware here!)
  const middlewareChain = createMiddlewareChain([
    // 1. CORS middleware (must be first for preflight)
    createCorsMiddleware()(deps),

    // 2. Nonce check middleware (replay attack prevention)
    createNonceMiddleware({ ttl: NONCE_TTL })(deps),

    // Add more middleware below, e.g.:
    // createRateLimitMiddleware({ maxRequests: 100, windowMs: 60000 })(deps),
    // createAuthMiddleware()(deps),

  ], requestMiddleware);

  return Bun.serve({
    port,
    async fetch(req, server) {
      const url = new URL(req.url);

      // Health check (bypass all middleware)
      if (url.pathname === "/health") {
        const now = new Date();
        const isoWIB = now.toISOString().replace("Z", "+07:00");
        return Response.json({
          status: "ok",
          timestamp: isoWIB,
        });
      }

      try {
        // Apply middleware chain for API routes
        if (url.pathname.startsWith("/api")) {
          return await middlewareChain(req, server);
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
