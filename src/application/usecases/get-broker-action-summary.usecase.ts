import { IBrokerActivityRepository, type BrokerActivityRaw } from "../../domain/repositories";
import { EmitenSummary } from "../../domain/entities";
import { BrokerValidator, DateValidator } from "../../utils/validation";
import { ValidationError } from "../../infrastructure/http/errors";

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
   * @throws ValidationError if input is invalid
   */
  async execute(input: GetBrokerActionSummaryInput): Promise<BrokerActionSummaryOutput> {
    this.validateInput(input);

    const { broker, from, to } = input;

    const rawActivity = await this.brokerActivityRepository.getActivityRaw(
      broker,
      from,
      to
    );

    const summaries = this.transformToSummaries(rawActivity);

    return {
      broker,
      period: { from, to },
      data: summaries,
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: GetBrokerActionSummaryInput): void {
    BrokerValidator.validateBrokerCode(input.broker);
    DateValidator.validateDateRange(input.from, input.to);
  }

  /**
   * Transform raw broker activity data to emiten summaries
   * Aggregates buy and sell data by emiten code
   */
  private transformToSummaries(rawActivity: BrokerActivityRaw): EmitenSummary[] {
    const summaryMap = this.initializeSummaryMap(rawActivity);
    return Object.values(summaryMap);
  }

  /**
   * Initialize and populate the summary map from raw activity data
   */
  private initializeSummaryMap(rawActivity: BrokerActivityRaw): Record<string, EmitenSummary> {
    const map: Record<string, EmitenSummary> = {};

    this.accumulateBuyData(map, rawActivity);
    this.accumulateSellData(map, rawActivity);

    return map;
  }

  /**
   * Accumulate buy data into the summary map
   */
  private accumulateBuyData(
    map: Record<string, EmitenSummary>,
    rawActivity: BrokerActivityRaw
  ): void {
    const buyList = this.filterNonNullItems(rawActivity.broker_summary.brokers_buy);

    for (const item of buyList) {
      const code = item.netbs_stock_code;

      if (!map[code]) {
        map[code] = EmitenSummary.create(code, 0, 0, 0, 0);
      }

      const existing = map[code];
      map[code] = EmitenSummary.create(
        code,
        existing.buyVolume + Number(item.blot),
        existing.sellVolume,
        existing.buyValue + Number(item.bval),
        existing.sellValue
      );
    }
  }

  /**
   * Accumulate sell data into the summary map
   */
  private accumulateSellData(
    map: Record<string, EmitenSummary>,
    rawActivity: BrokerActivityRaw
  ): void {
    const sellList = this.filterNonNullItems(rawActivity.broker_summary.brokers_sell);

    for (const item of sellList) {
      const code = item.netbs_stock_code;

      if (!map[code]) {
        map[code] = EmitenSummary.create(code, 0, 0, 0, 0);
      }

      const existing = map[code];
      map[code] = EmitenSummary.create(
        code,
        existing.buyVolume,
        existing.sellVolume + Math.abs(Number(item.slot)),
        existing.buyValue,
        existing.sellValue + Math.abs(Number(item.sval))
      );
    }
  }

  /**
   * Filter out null items from the list
   */
  private filterNonNullItems<T>(items: Array<T | null>): T[] {
    return items.filter((item): item is T => item !== null);
  }
}
