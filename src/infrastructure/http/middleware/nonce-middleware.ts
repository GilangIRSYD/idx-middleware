/**
 * Nonce Middleware
 * Provides replay attack prevention using X-Nonce header validation
 */

import type { IInMemoryStorageWithTTL } from "../../../domain/storage/storage.interface";
import type { RequestHandler } from "../../logger/middleware";
import type { AppLogger } from "../../logger/logger";
import { MissingNonceError, DuplicateNonceError } from "../errors/nonce-error";

export interface NonceMetadata {
  timestamp: number;
  path: string;
  method: string;
  ip: string;
}

export interface NonceMiddlewareOptions {
  nonceStorage: IInMemoryStorageWithTTL<NonceMetadata, string>;
  logger: AppLogger;
  ttl: number;
  headerName?: string;
}

/**
 * Create nonce validation middleware for replay attack prevention
 *
 * Flow:
 * 1. Client generates unique nonce (UUID/random) per request
 * 2. Client sends nonce in X-Nonce header
 * 3. Server validates nonce hasn't been used before
 * 4. Server stores nonce with TTL (5 minutes)
 * 5. Reused nonces are rejected
 *
 * @param options - Middleware configuration options
 * @returns Request handler middleware
 */
export function createNonceMiddleware(
  options: NonceMiddlewareOptions
): RequestHandler {
  const {
    nonceStorage,
    logger,
    ttl,
    headerName = "x-nonce",
  } = options;

  return async (
    request: Request,
    server: { requestIP: (req: Request) => { address: string } | null }
  ): Promise<Response> => {
    const nonce = request.headers.get(headerName);
    const url = new URL(request.url);
    const ip = server.requestIP(request)?.address ?? "unknown";

    // Validate nonce exists
    if (!nonce || nonce.trim() === "") {
      logger.warn("Missing nonce header", {
        path: url.pathname,
        method: request.method,
        ip,
      });

      throw new MissingNonceError();
    }

    // Check if nonce already used (replay attack)
    if (nonceStorage.has(nonce)) {
      logger.warn("Replay attack detected - duplicate nonce", {
        nonce,
        path: url.pathname,
        method: request.method,
        ip,
      });

      throw new DuplicateNonceError(nonce);
    }

    // Store nonce with metadata
    const metadata: NonceMetadata = {
      timestamp: Date.now(),
      path: url.pathname,
      method: request.method,
      ip,
    };

    nonceStorage.setWithTTL(nonce, {
      value: metadata,
      expiresAt: Date.now() + ttl,
    }, ttl);

    logger.debug("Nonce validated and stored", { nonce, path: url.pathname });

    // Return 404 - this middleware should be used with a handler
    // that continues to the router (use withNonceCheck helper)
    return new Response("Not Found", { status: 404 });
  };
}

/**
 * Helper to combine nonce check with actual request handler
 *
 * This wraps the handler with nonce validation while passing
 * through to the actual request handler.
 *
 * @param options - Middleware configuration options
 * @param handler - The next handler to call (e.g., router)
 * @returns Combined request handler
 */
export function withNonceCheck(
  options: NonceMiddlewareOptions,
  handler: (request: Request) => Promise<Response>
): (request: Request, server: { requestIP: (req: Request) => { address: string } | null }) => Promise<Response> {
  const {
    nonceStorage,
    logger,
    ttl,
    headerName = "x-nonce",
  } = options;

  return async (
    request: Request,
    server: { requestIP: (req: Request) => { address: string } | null }
  ): Promise<Response> => {
    const nonce = request.headers.get(headerName);
    const url = new URL(request.url);
    const ip = server.requestIP(request)?.address ?? "unknown";

    // Skip nonce check for health check
    if (url.pathname !== "/health") {
      // Validate nonce exists
      if (!nonce || nonce.trim() === "") {
        logger.warn("Missing nonce header", {
          path: url.pathname,
          method: request.method,
          ip,
        });

        throw new MissingNonceError();
      }

      // Check if nonce already used (replay attack)
      if (nonceStorage.has(nonce)) {
        logger.warn("Replay attack detected - duplicate nonce", {
          nonce,
          path: url.pathname,
          method: request.method,
          ip,
        });

        throw new DuplicateNonceError(nonce);
      }

      // Store nonce with metadata
      const metadata: NonceMetadata = {
        timestamp: Date.now(),
        path: url.pathname,
        method: request.method,
        ip,
      };

      nonceStorage.setWithTTL(nonce, {
        value: metadata,
        expiresAt: Date.now() + ttl,
      }, ttl);

      logger.debug("Nonce validated and stored", { nonce, path: url.pathname });
    }

    // Continue to handler
    return handler(request);
  };
}
