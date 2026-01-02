import { type IEmitenBrokerSummaryRepository } from "../../domain/repositories";
import { EmitenBrokerSummary } from "../../domain/entities";
import { DateValidator, EmitenValidator } from "../../utils/validation";
import { ValidationError } from "../../infrastructure/http/errors";

/**
 * Input DTO for GetEmitenBrokerSummary use case
 */
export interface GetEmitenBrokerSummaryInput {
  symbol: string;
  from: string;
  to: string;
}

/**
 * Output DTO for GetEmitenBrokerSummary use case
 */
export interface EmitenBrokerSummaryOutput {
  symbol: string;
  period: {
    from: string;
    to: string;
  };
  brokers_buy: ReturnType<EmitenBrokerBuy["toDTO"]>[];
  brokers_sell: ReturnType<EmitenBrokerSell["toDTO"]>[];
}

import type {
  EmitenBrokerBuy,
  EmitenBrokerSell,
} from "../../domain/entities/emiten-broker-summary.entity";

/**
 * Use case for getting emiten broker summary
 * Orchestrates fetching raw data and transforming it to business entities
 */
export class GetEmitenBrokerSummaryUseCase {
  constructor(
    private readonly emitenBrokerSummaryRepository: IEmitenBrokerSummaryRepository
  ) {}

  /**
   * Execute the use case
   * @param input - The input parameters
   * @returns Promise resolving to emiten broker summary output
   * @throws ValidationError if input is invalid
   */
  async execute(
    input: GetEmitenBrokerSummaryInput
  ): Promise<EmitenBrokerSummaryOutput> {
    this.validateInput(input);

    const { symbol, from, to } = input;

    const rawData =
      await this.emitenBrokerSummaryRepository.getEmitenBrokerSummaryRaw(
        symbol,
        from,
        to
      );

    const summary = EmitenBrokerSummary.create(
      rawData.broker_summary.symbol,
      rawData.from,
      rawData.to,
      rawData.broker_summary.brokers_buy,
      rawData.broker_summary.brokers_sell
    );

    const dto = summary.toDTO();

    return {
      symbol: dto.symbol,
      period: dto.period,
      brokers_buy: dto.brokers_buy,
      brokers_sell: dto.brokers_sell,
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: GetEmitenBrokerSummaryInput): void {
    EmitenValidator.validateSymbol(input.symbol);
    DateValidator.validateDateRange(input.from, input.to);
  }
}
