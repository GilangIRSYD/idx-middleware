/**
 * Main Entry Point (Composition Root)
 *
 * This is where we wire all dependencies together and start the server.
 * In Clean Architecture, this is the only place that knows about all layers.
 */

import {
  getAllBrokersUseCase,
  getBrokerActionSummaryUseCase,
  getBrokerEmitenDetailUseCase,
  getBrokerActionCalendarUseCase,
  getEmitenBrokerSummaryUseCase,
  setAccessTokenUseCase,
  getAccessTokenUseCase,
  deleteAccessTokenUseCase,
  BrokersController,
  BrokerActionSummaryController,
  BrokerEmitenDetailController,
  BrokerActionCalendarController,
  EmitenBrokerSummaryController,
  ConfigController,
  V1Router,
  createServer,
  logger,
  errorHandler,
  nonceStorage,
} from "./infrastructure/http";

const PORT = parseInt(process.env.PORT || "8001");

// Wire up controllers with their dependencies
const brokersController = new BrokersController(getAllBrokersUseCase);
const brokerActionSummaryController = new BrokerActionSummaryController(
  getBrokerActionSummaryUseCase
);
const brokerEmitenDetailController = new BrokerEmitenDetailController(
  getBrokerEmitenDetailUseCase
);
const brokerActionCalendarController = new BrokerActionCalendarController(
  getBrokerActionCalendarUseCase
);
const emitenBrokerSummaryController = new EmitenBrokerSummaryController(
  getEmitenBrokerSummaryUseCase
);
const configController = new ConfigController(
  setAccessTokenUseCase,
  getAccessTokenUseCase,
  deleteAccessTokenUseCase
);

// Wire up router with controllers
const v1Router = new V1Router(
  brokersController,
  brokerActionSummaryController,
  brokerEmitenDetailController,
  brokerActionCalendarController,
  emitenBrokerSummaryController,
  configController
);

// Start server
const server = createServer({
  port: 8001,
  v1Router,
  logger,
  errorHandler,
  nonceStorage,
});

logger.info(`Server running on http://localhost:${server.port}`);
