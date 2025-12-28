import {
  IBrokerActivityRepository,
  type BrokerActivityRaw,
} from "../../domain/repositories";

/**
 * Stockbit API Broker Activity Repository Implementation
 */
export class StockbitBrokerActivityRepository implements IBrokerActivityRepository {
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

  async getActivityRaw(
    broker: string,
    from: string,
    to: string
  ): Promise<BrokerActivityRaw> {
    if (this.useMock) {
      const data = await this.fetchMock("/marketdetectors-activity");
      return data.data;
    }

    const url =
      `${this.baseUrl}/marketdetectors/activity/${broker}/detail` +
      `?page=1&limit=50&from=${from}&to=${to}` +
      `&transaction_type=TRANSACTION_TYPE_NET` +
      `&market_board=MARKET_BOARD_ALL` +
      `&investor_type=INVESTOR_TYPE_ALL`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch broker activity: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.data;
  }

  private async fetchMock(path: string): Promise<any> {
    const file = await import(`../../../mock${path}.json`);
    return file.default;
  }
}
