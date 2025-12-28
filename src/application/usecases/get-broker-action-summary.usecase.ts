import { IBrokerActivityRepository } from "../../domain/repositories";
import { EmitenSummary } from "../../domain/entities";

/**
 * Input DTO for GetBrokerActionSummary use case
 */
export interface GetBrokerActionSummaryInput {
  broker: string;
  from: string;
  to: string;
}

/**
 * Output DTO for GetBrokerActionSummary use case
 */
export interface BrokerActionSummaryOutput {
  broker: string;
  period: {
    from: string;
    to: string;
  };
  data: EmitenSummary[];
}

/**
 * Use case for getting broker action summary
 * Orchestrates fetching raw data and transforming it to business entities
 */
export class GetBrokerActionSummaryUseCase {
  constructor(
    private readonly brokerActivityRepository: IBrokerActivityRepository
  ) {}

  /**
   * Execute the use case
   * @param input - The input parameters
   * @returns Promise resolving to broker action summary output
   */
  async execute(input: GetBrokerActionSummaryInput): Promise<BrokerActionSummaryOutput> {
    const { broker, from, to } = input;

    // Fetch raw data from repository
    const rawActivity = await this.brokerActivityRepository.getActivityRaw(
      broker,
      from,
      to
    );

    // Transform to business entities
    const summaries = this.transformToSummaries(rawActivity);

    return {
      broker,
      period: { from, to },
      data: summaries,
    };
  }

  private transformToSummaries(rawActivity: {
    broker_summary: { brokers_buy: Array<{ netbs_stock_code: string; blot: string; bval: string } | null>; brokers_sell: Array<{ netbs_stock_code: string; slot: string; sval: string } | null> };
  }): EmitenSummary[] {
    const map: Record<string, EmitenSummary> = {};

    const buyList = rawActivity.broker_summary.brokers_buy.filter((b): b is { netbs_stock_code: string; blot: string; bval: string } => b !== null);
    const sellList = rawActivity.broker_summary.brokers_sell.filter((s): s is { netbs_stock_code: string; slot: string; sval: string } => s !== null);

    for (const item of buyList) {
      const code = item.netbs_stock_code;

      if (!map[code]) {
        map[code] = EmitenSummary.create(code, 0, 0, 0, 0);
      }

      // Update by accumulating buy values
      const existing = map[code];
      const buyVolume = existing.buyVolume + Number(item.blot);
      const sellVolume = existing.sellVolume;
      const buyValue = existing.buyValue + Number(item.bval);
      const sellValue = existing.sellValue;

      map[code] = EmitenSummary.create(code, buyVolume, sellVolume, buyValue, sellValue);
    }

    for (const item of sellList) {
      const code = item.netbs_stock_code;

      if (!map[code]) {
        map[code] = EmitenSummary.create(code, 0, 0, 0, 0);
      }

      // Update by accumulating sell values
      const existing = map[code];
      const buyVolume = existing.buyVolume;
      const sellVolume = existing.sellVolume + Math.abs(Number(item.slot));
      const buyValue = existing.buyValue;
      const sellValue = existing.sellValue + Math.abs(Number(item.sval));

      map[code] = EmitenSummary.create(code, buyVolume, sellVolume, buyValue, sellValue);
    }

    return Object.values(map);
  }
}
