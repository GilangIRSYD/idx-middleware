/**
 * Nonce Check Middleware
 * Validates X-Nonce header for replay attack prevention
 */

import type { AppLogger } from "../../logger/logger";
import type { IInMemoryStorageWithTTL } from "../../../domain/storage/storage.interface";
import { MissingNonceError, DuplicateNonceError } from "../errors/nonce-error";
import type { Middleware, MiddlewareDependencies, ServerContext } from "./middleware-runner";

/**
 * Nonce check middleware configuration
 */
export interface NonceMiddlewareConfig {
  ttl: number; // TTL in milliseconds
  headerName?: string; // Default: x-nonce
}

/**
 * Create nonce check middleware factory
 *
 * Usage:
 * ```ts
 * const nonceMiddleware = createNonceMiddleware({ ttl: 300000 });
 * // Returns: (deps: MiddlewareDependencies) => Middleware
 * ```
 */
export function createNonceMiddleware(config: NonceMiddlewareConfig) {
  return (deps: MiddlewareDependencies): Middleware => {
    return async (
      req: Request,
      server: ServerContext,
      next: () => Promise<Response>
    ): Promise<Response> => {
      const { logger, nonceStorage } = deps;

      // Skip if nonceStorage not configured
      if (!nonceStorage) {
        return next();
      }

      const url = new URL(req.url);
      const ip = server?.requestIP?.(req)?.address ?? "unknown";
      const headerName = config.headerName ?? "x-nonce";

      // Only apply to API routes
      if (!url.pathname.startsWith("/api")) {
        return next();
      }

      const nonce = req.headers.get(headerName);

      // Validate nonce exists
      if (!nonce || nonce.trim() === "") {
        logger?.warn("Missing nonce header", {
          path: url.pathname,
          method: req.method,
          ip,
        });
        throw new MissingNonceError();
      }

      // Check for replay attack
      if (nonceStorage.has(nonce)) {
        logger?.warn("Replay attack detected - duplicate nonce", {
          nonce,
          path: url.pathname,
          method: req.method,
          ip,
        });
        throw new DuplicateNonceError(nonce);
      }

      // Store nonce with metadata
      const metadata = {
        timestamp: Date.now(),
        path: url.pathname,
        method: req.method,
        ip,
      };

      nonceStorage.setWithTTL(nonce, {
        value: metadata,
        expiresAt: Date.now() + config.ttl,
      }, config.ttl);

      logger?.debug("Nonce validated and stored", { nonce, path: url.pathname });

      // Continue to next middleware
      return next();
    };
  };
}
