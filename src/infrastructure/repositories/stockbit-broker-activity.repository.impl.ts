import {
  IBrokerActivityRepository,
  type BrokerActivityRaw,
} from "../../domain/repositories";
import { ApiConfig, ApiConstants } from "../../config";
import { ApiError } from "../http/errors";

/**
 * External API response type
 */
interface BrokerActivityResponseDTO {
  message: string;
  data: BrokerActivityRaw;
}

/**
 * Stockbit API Broker Activity Repository Implementation
 */
export class StockbitBrokerActivityRepository implements IBrokerActivityRepository {
  private readonly config: ApiConfig;

  constructor(config?: ApiConfig) {
    this.config = config ?? new ApiConfig();
  }

  async getActivityRaw(
    broker: string,
    from: string,
    to: string
  ): Promise<BrokerActivityRaw> {
    if (this.config.useMock) {
      const data = await this.fetchMock<BrokerActivityResponseDTO>(
        ApiConstants.MOCK_PATHS.BROKER_ACTIVITY
      );
      return data.data;
    }

    const url = this.config.getBrokerActivityUrl(broker, from, to);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch broker activity for '${broker}': ${response.status} ${response.statusText}`,
        undefined,
        response.status
      );
    }

    const result = await response.json() as BrokerActivityResponseDTO;
    return result.data;
  }

  private async fetchMock<T>(path: string): Promise<T> {
    const file = await import(`../../../mock${path}.json`) as Promise<{ default: T }>;
    return (await file).default;
  }
}
