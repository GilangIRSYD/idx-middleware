/**
 * API Constants
 * Centralized configuration for API-related constants
 */

export const ApiConstants = {
  // Base URLs
  STOCKBIT_BASE_URL: "https://exodus.stockbit.com/findata-view",
  STOCKBIT_ORDER_TRADE_BASE_URL: "https://exodus.stockbit.com/order-trade",

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 50,
  BROKER_PAGE_SIZE: 150,

  // API Parameters
  TRANSACTION_TYPE: "TRANSACTION_TYPE_NET",
  MARKET_BOARD: "MARKET_BOARD_ALL",
  INVESTOR_TYPE: "INVESTOR_TYPE_ALL",
  BROKER_GROUP_UNSPECIFIED: "GROUP_UNSPECIFIED",

  // API Endpoints
  ENDPOINTS: {
    BROKERS: "/marketdetectors/brokers",
    BROKER_ACTIVITY: (broker: string) => `/marketdetectors/activity/${broker}/detail`,
    BROKER_ACTION_CALENDAR: (symbol: string) => `/running-trade/chart/${symbol}`,
  } as const,

  // Mock file paths
  MOCK_PATHS: {
    BROKERS: "/marketdetectors-brokers",
    BROKER_ACTIVITY: "/marketdetectors-activity",
    BROKER_ACTION_CALENDAR: "/order-trade-running-trade-chart",
  } as const,
} as const;

/**
 * Trading Status Constants
 */
export const TradingStatus = {
  ACCUMULATION: "ACCUMULATION",
  DISTRIBUTION: "DISTRIBUTION",
  NEUTRAL: "NEUTRAL",
} as const;

export type TradingStatus = (typeof TradingStatus)[keyof typeof TradingStatus];

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
