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
  setAccessTokenUseCase,
  getAccessTokenUseCase,
  deleteAccessTokenUseCase,
  BrokersController,
  BrokerActionSummaryController,
  BrokerEmitenDetailController,
  BrokerActionCalendarController,
  ConfigController,
  V1Router,
  createServer,
  logger,
  errorHandler,
  nonceStorage,
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
const brokerActionCalendarController = new BrokerActionCalendarController(
  getBrokerActionCalendarUseCase
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
  configController
);

// Start server
const server = createServer({
  port: PORT,
  v1Router,
  logger,
  errorHandler,
  nonceStorage,
});

logger.info(`Server running on http://localhost:${server.port}`);
