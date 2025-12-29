import { IBrokerRepository } from "../../domain/repositories";
import { Broker } from "../../domain/entities";
import { ApiConfig, ApiConstants } from "../../config";
import { ApiError } from "../http/errors";

/**
 * External API response types
 */
interface BrokerListItemDTO {
  id: number;
  code: string;
  name: string;
  permission: string;
  group: string;
  color: string;
}

interface BrokersResponseDTO {
  message: string;
  data: BrokerListItemDTO[];
}

/**
 * Stockbit API Broker Repository Implementation
 * This is an infrastructure concern that knows how to fetch from Stockbit API
 */
export class StockbitBrokerRepository implements IBrokerRepository {
  private readonly config: ApiConfig;

  constructor(config?: ApiConfig) {
    this.config = config ?? new ApiConfig();
  }

  async getAll(): Promise<Broker[]> {
    const data = await this.fetchBrokers();
    return data.data.map((dto) => new Broker(dto.code, dto.name, dto.group));
  }

  async getByCode(code: string): Promise<Broker | null> {
    const brokers = await this.getAll();
    return brokers.find((b) => b.code === code) ?? null;
  }

  private async fetchBrokers(): Promise<BrokersResponseDTO> {
    if (this.config.useMock) {
      return this.fetchMock(ApiConstants.MOCK_PATHS.BROKERS);
    }

    const url = this.config.getBrokersUrl();
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch brokers: ${response.status} ${response.statusText}`,
        undefined,
        response.status
      );
    }

    return response.json();
  }

  private async fetchMock<T>(path: string): Promise<T> {
    const file = await import(`../../../mock${path}.json`) as Promise<{ default: T }>;
    return (await file).default;
  }
}
