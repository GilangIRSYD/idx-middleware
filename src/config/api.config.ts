/**
 * API Configuration
 * Configuration for external API connections
 */

import { ApiConstants } from "./constants";
import type { ConfigStorage } from "../domain/usecases/config.usecase";

export interface ApiConfigOptions {
  baseUrl?: string;
  accessToken?: string;
  useMock?: boolean;
  configStorage?: ConfigStorage;
}

/**
 * API Configuration class
 * Handles configuration for external API connections with environment variable support
 */
export class ApiConfig {
  readonly baseUrl: string;
  readonly useMock: boolean;
  private readonly configStorage?: ConfigStorage;

  constructor(options: ApiConfigOptions = {}) {
    this.baseUrl = options.baseUrl ?? ApiConstants.STOCKBIT_BASE_URL;
    this.useMock = options.useMock ?? process.env.USE_MOCK === "true";
    this.configStorage = options.configStorage;
  }

  /**
   * Get the access token from storage or environment
   * Priority: configStorage > environment variable
   */
  get accessToken(): string {
    // Try to get from config storage first
    if (this.configStorage) {
      const token = this.configStorage.getAccessToken();
      if (token) {
        return token;
      }
    }

    // Fall back to environment variable
    return this.getAccessTokenFromEnv();
  }

  private getAccessTokenFromEnv(): string {
    // If using mock mode, we don't need a real access token
    if (this.useMock) {
      return "";
    }

    const token = process.env.STOCKBIT_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "STOCKBIT_ACCESS_TOKEN environment variable is not set. " +
          "Please provide a valid access token via API endpoint or set USE_MOCK=true for development."
      );
    }
    return token;
  }

  /**
   * Create API URL for brokers endpoint
   */
  getBrokersUrl(): string {
    const params = new URLSearchParams({
      page: String(ApiConstants.DEFAULT_PAGE),
      limit: String(ApiConstants.BROKER_PAGE_SIZE),
      group: ApiConstants.BROKER_GROUP_UNSPECIFIED,
    });
    return `${this.baseUrl}${ApiConstants.ENDPOINTS.BROKERS}?${params}`;
  }

  /**
   * Create API URL for broker activity endpoint
   */
  getBrokerActivityUrl(broker: string, from: string, to: string): string {
    const params = new URLSearchParams({
      page: String(ApiConstants.DEFAULT_PAGE),
      limit: String(ApiConstants.DEFAULT_PAGE_SIZE),
      from,
      to,
      transaction_type: ApiConstants.TRANSACTION_TYPE,
      market_board: ApiConstants.MARKET_BOARD,
      investor_type: ApiConstants.INVESTOR_TYPE,
    });
    return `${this.baseUrl}${ApiConstants.ENDPOINTS.BROKER_ACTIVITY(broker)}?${params}`;
  }

  /**
   * Create API URL for broker action calendar endpoint
   */
  getBrokerActionCalendarUrl(symbol: string, brokers: string[], from: string, to: string): string {
    const params = new URLSearchParams({
      from,
      to,
    });
    for (const broker of brokers) {
      params.append("broker_code", broker);
    }
    return `${ApiConstants.STOCKBIT_ORDER_TRADE_BASE_URL}${ApiConstants.ENDPOINTS.BROKER_ACTION_CALENDAR(symbol)}?${params}`;
  }

  /**
   * Create API URL for emiten broker summary endpoint
   */
  getEmitenBrokerSummaryUrl(symbol: string, from: string, to: string): string {
    const params = new URLSearchParams({
      from,
      to,
      transaction_type: ApiConstants.TRANSACTION_TYPE,
      market_board: "MARKET_BOARD_REGULER",
      investor_type: ApiConstants.INVESTOR_TYPE,
      limit: "25",
    });
    return `${this.baseUrl}${ApiConstants.ENDPOINTS.EMITEN_BROKER_SUMMARY(symbol)}?${params}`;
  }
}
