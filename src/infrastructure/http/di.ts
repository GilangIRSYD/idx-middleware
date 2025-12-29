/**
 * Dependency Injection Container
 * This is the composition root where we wire all dependencies
 */

import { ApiConfig } from "../../config";
import {
  StockbitBrokerRepository,
  StockbitBrokerActivityRepository,
} from "../../infrastructure/repositories";
import {
  GetAllBrokersUseCase,
  GetBrokerActionSummaryUseCase,
  GetBrokerEmitenDetailUseCase,
} from "../../application/usecases";

// Create shared API configuration
const apiConfig = new ApiConfig();

// Repository instances
export const brokerRepository = new StockbitBrokerRepository(apiConfig);
export const brokerActivityRepository = new StockbitBrokerActivityRepository(apiConfig);

// Use case instances
export const getAllBrokersUseCase = new GetAllBrokersUseCase(brokerRepository);
export const getBrokerActionSummaryUseCase = new GetBrokerActionSummaryUseCase(
  brokerActivityRepository
);
export const getBrokerEmitenDetailUseCase = new GetBrokerEmitenDetailUseCase(
  brokerActivityRepository
);
