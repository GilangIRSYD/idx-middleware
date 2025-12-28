import { IBrokerActivityRepository } from "../../domain/repositories";
import { EmitenDetail } from "../../domain/entities";

/**
 * Input DTO for GetBrokerEmitenDetail use case
 */
export interface GetBrokerEmitenDetailInput {
  broker: string;
  emiten: string;
  from: string;
  to: string;
}

/**
 * Output DTO for GetBrokerEmitenDetail use case
 */
export interface BrokerEmitenDetailOutput {
  broker: string;
  emiten: string;
  period: {
    from: string;
    to: string;
  };
  calendar: EmitenDetail[];
}

/**
 * Use case for getting broker emiten detail
 * Orchestrates fetching raw data and transforming it to business entities
 */
export class GetBrokerEmitenDetailUseCase {
  constructor(
    private readonly brokerActivityRepository: IBrokerActivityRepository
  ) {}

  /**
   * Execute the use case
   * @param input - The input parameters
   * @returns Promise resolving to broker emiten detail output
   */
  async execute(input: GetBrokerEmitenDetailInput): Promise<BrokerEmitenDetailOutput> {
    const { broker, emiten, from, to } = input;

    // Fetch raw data from repository
    const rawActivity = await this.brokerActivityRepository.getActivityRaw(
      broker,
      from,
      to
    );

    // Transform to business entity
    const detail = this.transformToDetail(rawActivity, emiten);

    return {
      broker,
      emiten,
      period: { from, to },
      calendar: [detail],
    };
  }

  private transformToDetail(
    rawActivity: {
      from: string;
      broker_summary: {
        brokers_buy: Array<{ netbs_stock_code: string; blot: string; bval: string } | null>;
        brokers_sell: Array<{ netbs_stock_code: string; slot: string; sval: string } | null>;
      };
    },
    emiten: string
  ): EmitenDetail {
    const buyList = rawActivity.broker_summary.brokers_buy.filter((b): b is { netbs_stock_code: string; blot: string; bval: string } => b !== null);
    const sellList = rawActivity.broker_summary.brokers_sell.filter((s): s is { netbs_stock_code: string; slot: string; sval: string } => s !== null);

    const buy = buyList.find((x) => x.netbs_stock_code === emiten);
    const sell = sellList.find((x) => x.netbs_stock_code === emiten);

    const buyVol = buy ? Number(buy.blot) : 0;
    const sellVol = sell ? Math.abs(Number(sell.slot)) : 0;
    const buyVal = buy ? Number(buy.bval) : 0;
    const sellVal = sell ? Math.abs(Number(sell.sval)) : 0;

    return EmitenDetail.create(
      rawActivity.from,
      buyVol,
      sellVol,
      buyVal,
      sellVal
    );
  }
}
