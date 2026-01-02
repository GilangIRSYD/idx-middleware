import {
  type IEmitenBrokerSummaryRepository,
  type EmitenBrokerSummaryRaw,
} from "../../domain/repositories";
import { ApiConfig, ApiConstants } from "../../config";
import { ApiError } from "../http/errors";

/**
 * External API response type
 */
interface EmitenBrokerSummaryResponseDTO {
  message: string;
  data: EmitenBrokerSummaryRaw;
}

/**
 * Stockbit API Emiten Broker Summary Repository Implementation
 */
export class StockbitEmitenBrokerSummaryRepository
  implements IEmitenBrokerSummaryRepository
{
  private readonly config: ApiConfig;

  constructor(config?: ApiConfig) {
    this.config = config ?? new ApiConfig();
  }

  async getEmitenBrokerSummaryRaw(
    symbol: string,
    from: string,
    to: string
  ): Promise<EmitenBrokerSummaryRaw> {
    if (this.config.useMock) {
      const data = await this.fetchMock<EmitenBrokerSummaryResponseDTO>(
        ApiConstants.MOCK_PATHS.EMITEN_BROKER_SUMMARY
      );
      return data.data;
    }

    const url = this.config.getEmitenBrokerSummaryUrl(symbol, from, to);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch emiten broker summary for '${symbol}': ${response.status} ${response.statusText}`,
        undefined,
        response.status
      );
    }

    const result = (await response.json()) as EmitenBrokerSummaryResponseDTO;
    return result.data;
  }

  private async fetchMock<T>(path: string): Promise<T> {
    const file = (await import(
      `../../../mock${path}.json`
    )) as Promise<{ default: T }>;
    return (await file).default;
  }
}
