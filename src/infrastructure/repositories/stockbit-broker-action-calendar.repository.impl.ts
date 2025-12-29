import {
  IBrokerActionCalendarRepository,
  type BrokerActionCalendarRaw,
} from "../../domain/repositories";
import { ApiConfig, ApiConstants } from "../../config";
import { ApiError } from "../http/errors";

/**
 * External API response type
 */
interface BrokerActionCalendarResponseDTO {
  message: string;
  data: BrokerActionCalendarRaw;
}

/**
 * Stockbit API Broker Action Calendar Repository Implementation
 */
export class StockbitBrokerActionCalendarRepository implements IBrokerActionCalendarRepository {
  private readonly config: ApiConfig;

  constructor(config?: ApiConfig) {
    this.config = config ?? new ApiConfig();
  }

  async getCalendarRaw(
    symbol: string,
    brokers: string[],
    from: string,
    to: string
  ): Promise<BrokerActionCalendarRaw> {
    if (this.config.useMock) {
      const data = await this.fetchMock<BrokerActionCalendarResponseDTO>(
        ApiConstants.MOCK_PATHS.BROKER_ACTION_CALENDAR
      );
      return data.data;
    }

    const url = this.config.getBrokerActionCalendarUrl(symbol, brokers, from, to);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch broker action calendar for '${symbol}': ${response.status} ${response.statusText}`,
        undefined,
        response.status
      );
    }

    const result = await response.json() as BrokerActionCalendarResponseDTO;
    return result.data;
  }

  private async fetchMock<T>(path: string): Promise<T> {
    const file = await import(`../../../mock${path}.json`) as Promise<{ default: T }>;
    return (await file).default;
  }
}
