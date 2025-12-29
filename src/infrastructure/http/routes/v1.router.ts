import {
  BrokersController,
  BrokerActionSummaryController,
  BrokerEmitenDetailController,
  ConfigController,
} from "../controllers";

/**
 * V1 API Router
 * Routes HTTP requests to appropriate controllers
 */
export class V1Router {
  constructor(
    private readonly brokersController: BrokersController,
    private readonly brokerActionSummaryController: BrokerActionSummaryController,
    private readonly brokerEmitenDetailController: BrokerEmitenDetailController,
    private readonly configController: ConfigController
  ) {}

  /**
   * Route handler for V1 API endpoints
   */
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // GET /api/v1/brokers - Get list of brokers
    if (pathname === "/api/v1/brokers" && req.method === "GET") {
      return this.brokersController.getAllBrokers();
    }

    // GET /api/v1/broker-action-summary - Get broker activity summary
    if (pathname === "/api/v1/broker-action-summary" && req.method === "GET") {
      return this.brokerActionSummaryController.getBrokerActionSummary(req);
    }

    // GET /api/v1/broker-emiten-detail - Get broker emiten detail
    if (pathname === "/api/v1/broker-emiten-detail" && req.method === "GET") {
      return this.brokerEmitenDetailController.getBrokerEmitenDetail(req);
    }

    // POST /api/v1/config/access-token - Set access token
    if (pathname === "/api/v1/config/access-token" && req.method === "POST") {
      return this.configController.setAccessToken(req);
    }

    // GET /api/v1/config/access-token - Get access token (masked)
    if (pathname === "/api/v1/config/access-token" && req.method === "GET") {
      return this.configController.getAccessToken();
    }

    // DELETE /api/v1/config/access-token - Delete access token
    if (pathname === "/api/v1/config/access-token" && req.method === "DELETE") {
      return this.configController.deleteAccessToken();
    }

    return new Response("Endpoint not found", { status: 404 });
  }
}
