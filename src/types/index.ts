// Broker types
export interface Broker {
  code: string;
  name: string;
  group: string;
}

export interface BrokerListItem {
  id: number;
  code: string;
  name: string;
  permission: string;
  group: string;
  color: string;
}

export interface BrokersResponse {
  message: string;
  data: BrokerListItem[];
}

// Broker activity types
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

export interface BrokerSummary {
  brokers_buy: BrokerBuyItem[];
  brokers_sell: BrokerSellItem[];
  symbol: string;
}

export interface BrokerActivityResponse {
  message: string;
  data: {
    bandar_detector: unknown;
    broker_summary: BrokerSummary;
    from: string;
    to: string;
    broker_code: string;
    broker_name: string;
  };
}

// Transformed types
export interface EmitenSummary {
  emiten: string;
  buy_volume: number;
  sell_volume: number;
  net_volume: number;
  buy_value: number;
  sell_value: number;
  net_value: number;
  status: "ACCUMULATION" | "DISTRIBUTION" | "NEUTRAL";
}

export interface EmitenDetail {
  date: string;
  buy_volume: number;
  sell_volume: number;
  net_volume: number;
  buy_value: number;
  sell_value: number;
  net_value: number;
  status: "ACCUMULATION" | "DISTRIBUTION" | "NEUTRAL";
}

export interface BrokerActionSummaryResponse {
  broker: string;
  period: {
    from: string;
    to: string;
  };
  data: EmitenSummary[];
}

export interface BrokerEmitenDetailResponse {
  broker: string;
  emiten: string;
  period: {
    from: string;
    to: string;
  };
  calendar: EmitenDetail[];
}
