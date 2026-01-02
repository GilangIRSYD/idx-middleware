import {
  type BrokerBuyItemRaw,
  type BrokerSellItemRaw,
} from "../entities/emiten-broker-summary.entity";

/**
 * Raw emiten broker summary data from external API
 */
export interface EmitenBrokerSummaryRaw {
  broker_summary: {
    brokers_buy: BrokerBuyItemRaw[];
    brokers_sell: BrokerSellItemRaw[];
    symbol: string;
  };
  from: string;
  to: string;
}

/**
 * Repository interface for emiten broker summary data access
 */
export interface IEmitenBrokerSummaryRepository {
  /**
   * Get raw emiten broker summary data from external source
   * @param symbol - The stock/emiten code
   * @param from - Start date (format: YYYY-MM-DD)
   * @param to - End date (format: YYYY-MM-DD)
   * @returns Promise resolving to raw emiten broker summary data
   */
  getEmitenBrokerSummaryRaw(
    symbol: string,
    from: string,
    to: string
  ): Promise<EmitenBrokerSummaryRaw>;
}
