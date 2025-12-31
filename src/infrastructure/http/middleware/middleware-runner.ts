/**
 * Middleware Runner
 * Provides a composable middleware chain system for Bun HTTP server
 */

import type { AppLogger } from "../../logger/logger";
import type { IInMemoryStorageWithTTL } from "../../../domain/storage/storage.interface";

/**
 * Server context passed to middleware
 */
export interface ServerContext {
  requestIP: (req: Request) => { address: string } | null;
}

/**
 * Middleware function type
 * Each middleware receives:
 * - req: The incoming request
 * - server: Server context (for IP, etc)
 * - next: Function to call next middleware
 *
 * Middleware can:
 * - Call next() to continue to next middleware
 * - Return Response to short-circuit (end the request)
 * - Throw error to be caught by global error handler
 */
export type Middleware = (
  req: Request,
  server: ServerContext,
  next: () => Promise<Response>
) => Promise<Response>;

/**
 * Dependencies that can be injected into middleware
 */
export interface MiddlewareDependencies {
  logger?: AppLogger;
  nonceStorage?: IInMemoryStorageWithTTL<{ timestamp: number; path: string; method: string; ip: string }, string>;
  // Add more dependencies here for future middleware
}

/**
 * Create a middleware chain runner
 * Runs middleware in order and calls the final handler at the end
 *
 * @param middlewares - Array of middleware functions to run
 * @param finalHandler - The final handler to call after all middleware (receives req, server)
 * @returns A function that runs the middleware chain
 */
export function createMiddlewareChain(
  middlewares: Middleware[],
  finalHandler: (req: Request, server: ServerContext) => Promise<Response>
): (req: Request, server: ServerContext) => Promise<Response> {
  return async (req: Request, server: ServerContext): Promise<Response> => {
    let index = 0;

    /**
     * Dispatch middleware at current index
     * If all middleware completed, call final handler
     */
    const dispatch = async (i: number): Promise<Response> => {
      // All middleware done, call final handler
      if (i >= middlewares.length) {
        return finalHandler(req, server);
      }

      // Get current middleware
      const middleware = middlewares[i];

      // Call middleware with next() function that calls next middleware
      return middleware(req, server, () => dispatch(i + 1));
    };

    // Start middleware chain from index 0
    return dispatch(0);
  };
}

/**
 * Create a middleware runner with dependencies
 * This is a helper to create middleware with access to shared dependencies
 *
 * @param deps - Dependencies to inject into middleware factory
 * @returns A function to create and run middleware chain
 */
export function createMiddlewareRunner(deps: MiddlewareDependencies) {
  return {
    /**
     * Run an array of middleware with a final handler
     */
    use: (middlewareFns: Array<(deps: MiddlewareDependencies) => Middleware>) => {
      const middlewares = middlewareFns.map(fn => fn(deps));
      return (finalHandler: (req: Request, server: ServerContext) => Promise<Response>) =>
        createMiddlewareChain(middlewares, finalHandler);
    }
  };
}
