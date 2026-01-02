import type { Middleware, MiddlewareDependencies } from "./middleware-runner";

/**
 * CORS Headers for all responses
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Nonce",
};

/**
 * Create CORS middleware
 *
 * Handles preflight OPTIONS requests and adds CORS headers to all responses
 */
export function createCorsMiddleware(): (deps: MiddlewareDependencies) => Middleware {
  return (deps: MiddlewareDependencies) => {
    return async (req, server, next) => {
      // Handle preflight request
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }

      // Pass to next middleware/handler
      const response = await next(req, server);

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  };
}
