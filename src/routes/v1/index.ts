import { getBrokers } from "./brokers";
import { getBrokerSummary } from "./broker-action-summary";
import { getBrokerEmitenDetail } from "./broker-emiten-detail";

export const v1Router = {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // GET /api/v1/brokers - Get list of brokers
    if (pathname === "/api/v1/brokers" && req.method === "GET") {
      return getBrokers(req);
    }

    // GET /api/v1/broker-action-summary - Get broker activity summary
    if (pathname === "/api/v1/broker-action-summary" && req.method === "GET") {
      return getBrokerSummary(req);
    }

    // GET /api/v1/broker-emiten-detail - Get broker emiten detail
    if (pathname === "/api/v1/broker-emiten-detail" && req.method === "GET") {
      return getBrokerEmitenDetail(req);
    }

    return new Response("Endpoint not found", { status: 404 });
  },
};
