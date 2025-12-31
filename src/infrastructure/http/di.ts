/**
 * Dependency Injection Container
 * This is the composition root where we wire all dependencies
 */

import { ApiConfig } from "../../config";
import {
  StockbitBrokerRepository,
  StockbitBrokerActivityRepository,
  StockbitBrokerActionCalendarRepository,
} from "../../infrastructure/repositories";
import {
  GetAllBrokersUseCase,
  GetBrokerActionSummaryUseCase,
  GetBrokerEmitenDetailUseCase,
  GetBrokerActionCalendarUseCase,
} from "../../application/usecases";
import {
  InMemoryStorage,
  InMemoryStorageWithTTL,
} from "../../infrastructure/storage";
import { ConfigStorageImpl } from "../../infrastructure/storage/config-storage.impl";
import {
  SetAccessTokenUseCase,
  GetAccessTokenUseCase,
  DeleteAccessTokenUseCase,
} from "../../domain/usecases/config.usecase";
import { AppLogger, createLogger } from "../../infrastructure/logger/logger";
import { ErrorHandler } from "./errors/error-handler";

// Logger - create singleton instance
export const logger = createLogger();

// Error handler
export const errorHandler = new ErrorHandler(logger);

// Config storage - must be created before ApiConfig
const configStorage = new ConfigStorageImpl();

// Create shared API configuration with config storage
const apiConfig = new ApiConfig({ configStorage });

// Storage instances
export const cacheStorage = new InMemoryStorageWithTTL<any, string>({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  autoCleanup: true,
  cleanupInterval: 60 * 1000, // 1 minute
});

export const sessionStorage = new InMemoryStorage<any, string>({
  maxSize: 100,
});

export const rateLimitStorage = new InMemoryStorageWithTTL<number[], string>({
  defaultTTL: 60 * 1000, // 1 minute
  autoCleanup: true,
});

/**
 * Nonce storage for replay attack prevention
 * Stores request nonces with 5-minute TTL
 * Auto-cleanup runs every 8 hours
 */
export const nonceStorage = new InMemoryStorageWithTTL<{
  timestamp: number;
  path: string;
  method: string;
  ip: string;
}, string>({
  defaultTTL: 5 * 60 * 1000,        // 5 minutes
  autoCleanup: true,
  cleanupInterval: 8 * 60 * 60 * 1000,  // 8 hours
  onExpire: (key: string, value: any) => {
    logger.debug("Nonce expired", { nonce: key, ...value });
  },
});

// Repository instances
export const brokerRepository = new StockbitBrokerRepository(apiConfig);
export const brokerActivityRepository = new StockbitBrokerActivityRepository(apiConfig);
export const brokerActionCalendarRepository = new StockbitBrokerActionCalendarRepository(apiConfig);

// Use case instances
export const getAllBrokersUseCase = new GetAllBrokersUseCase(brokerRepository);
export const getBrokerActionSummaryUseCase = new GetBrokerActionSummaryUseCase(
  brokerActivityRepository
);
export const getBrokerEmitenDetailUseCase = new GetBrokerEmitenDetailUseCase(
  brokerActivityRepository
);
export const getBrokerActionCalendarUseCase = new GetBrokerActionCalendarUseCase(
  brokerActionCalendarRepository
);

// Config use case instances
export const setAccessTokenUseCase = new SetAccessTokenUseCase(configStorage);
export const getAccessTokenUseCase = new GetAccessTokenUseCase(configStorage);
export const deleteAccessTokenUseCase = new DeleteAccessTokenUseCase(configStorage);
