import { V1Router } from "./routes";

/**
 * HTTP Server configuration and setup
 */
export interface ServerConfig {
  port: number;
  v1Router: V1Router;
}

/**
 * Create and configure the Bun HTTP server
 */
export function createServer(config: ServerConfig) {
  const { port, v1Router } = config;

  return Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // Health check
      if (url.pathname === "/health") {
        return Response.json({
          status: "ok",
          timestamp: new Date().toISOString(),
        });
      }

      // API routes
      if (url.pathname.startsWith("/api")) {
        return v1Router.fetch(req);
      }

      // 404
      return new Response("Not Found", { status: 404 });
    },
  });
}
