import { IBrokerActivityRepository, type BrokerActivityRaw } from "../../domain/repositories";
import { EmitenDetail } from "../../domain/entities";
import { BrokerValidator, DateValidator, StringValidator } from "../../utils/validation";

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
 * Types for raw broker activity data from API
 */
interface BrokerBuyItem {
  netbs_stock_code: string;
  blot: string;
  bval: string;
}

interface BrokerSellItem {
  netbs_stock_code: string;
  slot: string;
  sval: string;
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
   * @throws ValidationError if input is invalid
   */
  async execute(input: GetBrokerEmitenDetailInput): Promise<BrokerEmitenDetailOutput> {
    this.validateInput(input);

    const { broker, emiten, from, to } = input;

    const rawActivity = await this.brokerActivityRepository.getActivityRaw(
      broker,
      from,
      to
    );

    const detail = this.transformToDetail(rawActivity, emiten);

    return {
      broker,
      emiten,
      period: { from, to },
      calendar: [detail],
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: GetBrokerEmitenDetailInput): void {
    BrokerValidator.validateBrokerCode(input.broker);
    StringValidator.validateNonEmpty(input.emiten, "Emiten code");
    DateValidator.validateDateRange(input.from, input.to);
  }

  /**
   * Transform raw broker activity data to emiten detail
   */
  private transformToDetail(
    rawActivity: BrokerActivityRaw,
    emiten: string
  ): EmitenDetail {
    const buyList = this.filterNonNullItems<BrokerBuyItem>(
      rawActivity.broker_summary.brokers_buy
    );
    const sellList = this.filterNonNullItems<BrokerSellItem>(
      rawActivity.broker_summary.brokers_sell
    );

    const buy = buyList.find((x) => x.netbs_stock_code === emiten);
    const sell = sellList.find((x) => x.netbs_stock_code === emiten);

    const buyVolume = buy ? Number(buy.blot) : 0;
    const sellVolume = sell ? Math.abs(Number(sell.slot)) : 0;
    const buyValue = buy ? Number(buy.bval) : 0;
    const sellValue = sell ? Math.abs(Number(sell.sval)) : 0;

    return EmitenDetail.create(
      rawActivity.from,
      buyVolume,
      sellVolume,
      buyValue,
      sellValue
    );
  }

  /**
   * Filter out null items from the list
   */
  private filterNonNullItems<T>(items: Array<T | null>): T[] {
    return items.filter((item): item is T => item !== null);
  }
}
