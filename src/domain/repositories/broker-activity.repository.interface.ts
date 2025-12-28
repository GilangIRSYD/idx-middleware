import { EmitenSummary, EmitenDetail } from "../entities";

/**
 * Raw broker activity data from external API
 * This represents the shape of data before transformation
 */
export interface BrokerBuyItem {
  blot: string;
  blotv: string;
  bval: string;
  bvalv: string;
  netbs_broker_code: string;
  netbs_buy_avg_price: string;
  netbs_date: string;
  netbs_stock_code: string;
  type: string;
}

export interface BrokerSellItem {
  netbs_broker_code: string;
  netbs_date: string;
  netbs_sell_avg_price: string;
  netbs_stock_code: string;
  slot: string;
  slotv: string;
  sval: string;
  svalv: string;
  type: string;
}

export interface BrokerSummaryRaw {
  brokers_buy: BrokerBuyItem[];
  brokers_sell: BrokerSellItem[];
  symbol: string;
}

export interface BrokerActivityRaw {
  bandar_detector: unknown;
  broker_summary: BrokerSummaryRaw;
  from: string;
  to: string;
  broker_code: string;
  broker_name: string;
}

/**
 * Repository interface for broker activity data access
 */
export interface IBrokerActivityRepository {
  /**
   * Get raw broker activity data from external source
   * @param broker - The broker code
   * @param from - Start date (format: YYYY-MM-DD)
   * @param to - End date (format: YYYY-MM-DD)
   * @returns Promise resolving to raw broker activity data
   */
  getActivityRaw(
    broker: string,
    from: string,
    to: string
  ): Promise<BrokerActivityRaw>;
}
