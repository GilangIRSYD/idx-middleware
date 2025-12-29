/**
 * API Configuration
 * Configuration for external API connections
 */

import { ApiConstants } from "./constants";

export interface ApiConfigOptions {
  baseUrl?: string;
  accessToken?: string;
  useMock?: boolean;
}

/**
 * API Configuration class
 * Handles configuration for external API connections with environment variable support
 */
export class ApiConfig {
  readonly baseUrl: string;
  readonly accessToken: string;
  readonly useMock: boolean;

  constructor(options: ApiConfigOptions = {}) {
    this.baseUrl = options.baseUrl ?? ApiConstants.STOCKBIT_BASE_URL;
    this.useMock = options.useMock ?? process.env.USE_MOCK === "true";

    // Only require access token if not using mock mode
    this.accessToken = options.accessToken ?? this.getAccessTokenFromEnv();
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
          "Please provide a valid access token or set USE_MOCK=true for development."
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
}
