import { IBrokerRepository } from "../../domain/repositories";
import { Broker } from "../../domain/entities";

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
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly useMock: boolean;

  constructor(config?: { baseUrl?: string; accessToken?: string; useMock?: boolean }) {
    this.baseUrl = config?.baseUrl ?? "https://exodus.stockbit.com/findata-view";
    this.accessToken =
      config?.accessToken ??
      "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU3MDc0NjI3LTg4MWItNDQzZC04OTcyLTdmMmMzOTNlMzYyOSIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InVzZSI6ImNvbnNvbGVnaWxhbmciLCJlbWEiOiJjb25zb2xlLmdpbGFuZ0BnbWFpbC5jb20iLCJmdWwiOiJjb25zb2xlIGdpbGFuZyIsInNlcyI6ImxxMHpoZzZYekdLRjNEdDEiLCJkdmMiOiJkNDcxZGJjNjQ1ZmY4NmQzZTk4YWQ3MGM0ZDc4Mzg2OCIsInVpZCI6NTkyOTM2MCwiY291IjoiU0cifSwiZXhwIjoxNzY2OTYwNzM1LCJpYXQiOjE3NjY4NzQzMzUsImlzcyI6IlNUT0NLQklUIiwianRpIjoiMjA3Njg5NDgtMmMyOC00NTVkLTk2MDUtNWZjMTNhNDQ3ZDU4IiwibmJmIjoxNzY2ODc0MzM1LCJ2ZXIiOiJ2MSJ9.eM06Hh__4X0YBREy9EhxuNVkVTmvihXElv9_bLgCBeTysRnJq1D7znGM1mpdqMPQ6CYxpBiABoLJ9XX5EaWHl77rEzRtt7AplP7NOU4nr8IjGuCN-66JSu2OGVNbqLtqDyRMu2o2l1ihaE5NvQ5jipGHYTWJztjgW-fgKWPeqeIxlh6hWZa3EH9A3zNjfJ1lIC-lndY12tkzamBcA7E5ZMtdOXm7zNBpu59_rneLonRyTi7Wd0uOyoHnjXV2zX5-GvHr-PTHOOv8vuPGjTZd8jOvCYJncykFNeejMXF-WC7vsnPq8i0iP7mQduYquCk_HjmXKqH9xw6G3HLZ87h6zg";
    this.useMock = config?.useMock ?? process.env.USE_MOCK === "true";
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
    if (this.useMock) {
      return this.fetchMock("/marketdetectors-brokers");
    }

    const url = `${this.baseUrl}/marketdetectors/brokers?page=1&limit=150&group=GROUP_UNSPECIFIED`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch brokers: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchMock(path: string): Promise<any> {
    const file = await import(`../../../mock${path}.json`);
    return file.default;
  }
}
