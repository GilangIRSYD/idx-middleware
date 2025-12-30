import { AppLogger } from "./logger";
import crypto from "node:crypto";

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Extract request ID from headers or generate new one
 */
function getRequestId(request: Request): string {
  const headerId = request.headers.get("x-request-id");
  if (headerId) {
    return headerId;
  }
  return generateRequestId();
}

/**
 * Request handler type - handles a request and returns a response
 */
export type RequestHandler = (
  request: Request,
  server: { requestIP: (req: Request) => { address: string } | null }
) => Promise<Response>;

/**
 * Create request logging middleware
 *
 * This middleware:
 * 1. Generates or extracts request ID
 * 2. Adds request ID to response headers
 * 3. Logs incoming requests
 * 4. Logs outgoing responses
 * 5. Cleans up request ID after request completes
 *
 * @param logger - The logger instance
 * @param handler - The next handler to call (e.g., router)
 */
export function createRequestMiddleware(
  logger: AppLogger,
  handler: (request: Request) => Promise<Response>
): RequestHandler {
  return async (
    request: Request,
    server: { requestIP: (req: Request) => { address: string } | null }
  ): Promise<Response> => {
    const requestId = getRequestId(request);
    logger.setRequestId(requestId);

    const startTime = performance.now();
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const ip = server.requestIP(request)?.address ?? "unknown";

    logger.info("Incoming request", {
      method,
      path,
      ip,
    });

    try {
      const response = await handler(request);

      const duration = performance.now() - startTime;

      logger.info("Request completed", {
        method,
        path,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`,
      });

      // Add request ID to response headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set("x-request-id", requestId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      const duration = performance.now() - startTime;

      logger.error("Request failed", error, {
        method,
        path,
        duration: `${duration.toFixed(2)}ms`,
      });

      throw error;
    } finally {
      logger.clearRequestId();
    }
  };
}
