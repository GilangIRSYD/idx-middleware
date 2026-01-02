/**
 * Domain entity representing broker buy/sell data for an emiten
 */
export class EmitenBrokerBuy {
  constructor(
    public readonly brokerCode: string,
    public readonly buyVolume: number,
    public readonly buyVolumeAvg: number,
    public readonly buyValue: number,
    public readonly buyValueAvg: number,
    public readonly avgPrice: number,
    public readonly type: BrokerType,
    public readonly date: string,
    public readonly stockCode: string
  ) {}

  toDTO(): EmitenBrokerBuyDTO {
    return {
      broker_code: this.brokerCode,
      buy_volume: this.buyVolume,
      buy_volume_avg: this.buyVolumeAvg,
      buy_value: this.buyValue,
      buy_value_avg: this.buyValueAvg,
      avg_price: this.avgPrice,
      type: this.type,
      date: this.date,
      stock_code: this.stockCode,
    };
  }

  static fromRaw(buyItem: BrokerBuyItemRaw): EmitenBrokerBuy {
    return new EmitenBrokerBuy(
      buyItem.netbs_broker_code,
      Number(buyItem.blot),
      Number(buyItem.blotv),
      Number(buyItem.bval),
      Number(buyItem.bvalv),
      Number(buyItem.netbs_buy_avg_price),
      buyItem.type as BrokerType,
      buyItem.netbs_date,
      buyItem.netbs_stock_code
    );
  }
}

export class EmitenBrokerSell {
  constructor(
    public readonly brokerCode: string,
    public readonly sellVolume: number,
    public readonly sellVolumeAvg: number,
    public readonly sellValue: number,
    public readonly sellValueAvg: number,
    public readonly avgPrice: number,
    public readonly type: BrokerType,
    public readonly date: string,
    public readonly stockCode: string
  ) {}

  toDTO(): EmitenBrokerSellDTO {
    return {
      broker_code: this.brokerCode,
      sell_volume: this.sellVolume,
      sell_volume_avg: this.sellVolumeAvg,
      sell_value: this.sellValue,
      sell_value_avg: this.sellValueAvg,
      avg_price: this.avgPrice,
      type: this.type,
      date: this.date,
      stock_code: this.stockCode,
    };
  }

  static fromRaw(sellItem: BrokerSellItemRaw): EmitenBrokerSell {
    return new EmitenBrokerSell(
      sellItem.netbs_broker_code,
      Math.abs(Number(sellItem.slot)),
      Number(sellItem.slotv),
      Math.abs(Number(sellItem.sval)),
      Number(sellItem.svalv),
      Number(sellItem.netbs_sell_avg_price),
      sellItem.type as BrokerType,
      sellItem.netbs_date,
      sellItem.netbs_stock_code
    );
  }
}

export class EmitenBrokerSummary {
  constructor(
    public readonly symbol: string,
    public readonly period: {
      from: string;
      to: string;
    },
    public readonly brokersBuy: EmitenBrokerBuy[],
    public readonly brokersSell: EmitenBrokerSell[]
  ) {}

  toDTO(): EmitenBrokerSummaryDTO {
    return {
      symbol: this.symbol,
      period: this.period,
      brokers_buy: this.brokersBuy.map((b) => b.toDTO()),
      brokers_sell: this.brokersSell.map((b) => b.toDTO()),
    };
  }

  static create(
    symbol: string,
    from: string,
    to: string,
    buyItems: BrokerBuyItemRaw[],
    sellItems: BrokerSellItemRaw[]
  ): EmitenBrokerSummary {
    return new EmitenBrokerSummary(
      symbol,
      { from, to },
      buyItems.map((item) => EmitenBrokerBuy.fromRaw(item)),
      sellItems.map((item) => EmitenBrokerSell.fromRaw(item))
    );
  }
}

export type BrokerType = "Asing" | "Lokal" | "Pemerintah";

export interface EmitenBrokerBuyDTO {
  broker_code: string;
  buy_volume: number;
  buy_volume_avg: number;
  buy_value: number;
  buy_value_avg: number;
  avg_price: number;
  type: BrokerType;
  date: string;
  stock_code: string;
}

export interface EmitenBrokerSellDTO {
  broker_code: string;
  sell_volume: number;
  sell_volume_avg: number;
  sell_value: number;
  sell_value_avg: number;
  avg_price: number;
  type: BrokerType;
  date: string;
  stock_code: string;
}

export interface EmitenBrokerSummaryDTO {
  symbol: string;
  period: {
    from: string;
    to: string;
  };
  brokers_buy: EmitenBrokerBuyDTO[];
  brokers_sell: EmitenBrokerSellDTO[];
}

export interface BrokerBuyItemRaw {
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

export interface BrokerSellItemRaw {
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
