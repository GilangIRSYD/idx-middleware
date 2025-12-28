/**
 * Dependency Injection Container
 * This is the composition root where we wire all dependencies
 */

import {
  StockbitBrokerRepository,
  StockbitBrokerActivityRepository,
} from "../../infrastructure/repositories";
import {
  GetAllBrokersUseCase,
  GetBrokerActionSummaryUseCase,
  GetBrokerEmitenDetailUseCase,
} from "../../application/usecases";

// Repository instances
export const brokerRepository = new StockbitBrokerRepository();
export const brokerActivityRepository = new StockbitBrokerActivityRepository();

// Use case instances
export const getAllBrokersUseCase = new GetAllBrokersUseCase(brokerRepository);
export const getBrokerActionSummaryUseCase = new GetBrokerActionSummaryUseCase(
  brokerActivityRepository
);
export const getBrokerEmitenDetailUseCase = new GetBrokerEmitenDetailUseCase(
  brokerActivityRepository
);
