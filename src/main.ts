/**
 * Main Entry Point (Composition Root)
 *
 * This is where we wire all dependencies together and start the server.
 * In Clean Architecture, this is the only place that knows about all layers.
 */

import {
  brokerRepository,
  brokerActivityRepository,
  getAllBrokersUseCase,
  getBrokerActionSummaryUseCase,
  getBrokerEmitenDetailUseCase,
  BrokersController,
  BrokerActionSummaryController,
  BrokerEmitenDetailController,
  V1Router,
  createServer,
} from "./infrastructure/http";

const PORT = parseInt(process.env.PORT || "8000");

// Wire up controllers with their dependencies
const brokersController = new BrokersController(getAllBrokersUseCase);
const brokerActionSummaryController = new BrokerActionSummaryController(
  getBrokerActionSummaryUseCase
);
const brokerEmitenDetailController = new BrokerEmitenDetailController(
  getBrokerEmitenDetailUseCase
);

// Wire up router with controllers
const v1Router = new V1Router(
  brokersController,
  brokerActionSummaryController,
  brokerEmitenDetailController
);

// Start server
const server = createServer({
  port: PORT,
  v1Router,
});

console.log(`Server running on http://localhost:${server.port}`);
