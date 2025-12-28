/**
 * Domain entity representing emiten trading summary
 */
export class EmitenSummary {
  constructor(
    public readonly emiten: string,
    public readonly buyVolume: number,
    public readonly sellVolume: number,
    public readonly netVolume: number,
    public readonly buyValue: number,
    public readonly sellValue: number,
    public readonly netValue: number,
    public readonly status: TradingStatus
  ) {}

  static create(
    emiten: string,
    buyVolume: number,
    sellVolume: number,
    buyValue: number,
    sellValue: number
  ): EmitenSummary {
    const netVolume = buyVolume - sellVolume;
    const netValue = buyValue - sellValue;
    const status = EmitenSummary.determineStatus(netVolume);

    return new EmitenSummary(
      emiten,
      buyVolume,
      sellVolume,
      netVolume,
      buyValue,
      sellValue,
      netValue,
      status
    );
  }

  private static determineStatus(netVolume: number): TradingStatus {
    if (netVolume > 0) return "ACCUMULATION";
    if (netVolume < 0) return "DISTRIBUTION";
    return "NEUTRAL";
  }

  toDTO(): EmitenSummaryDTO {
    return {
      emiten: this.emiten,
      buy_volume: this.buyVolume,
      sell_volume: this.sellVolume,
      net_volume: this.netVolume,
      buy_value: this.buyValue,
      sell_value: this.sellValue,
      net_value: this.netValue,
      status: this.status,
    };
  }
}

export type TradingStatus = "ACCUMULATION" | "DISTRIBUTION" | "NEUTRAL";

export interface EmitenSummaryDTO {
  emiten: string;
  buy_volume: number;
  sell_volume: number;
  net_volume: number;
  buy_value: number;
  sell_value: number;
  net_value: number;
  status: TradingStatus;
}
