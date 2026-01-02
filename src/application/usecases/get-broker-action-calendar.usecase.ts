import {
  IBrokerActionCalendarRepository,
  type BrokerActionCalendarRaw,
  type ChartDataPoint,
  type BrokerChartDataByType,
} from "../../domain/repositories";
import { DateValidator, BrokerValidator } from "../../utils/validation";
import { ValidationError } from "../../infrastructure/http/errors";

/**
 * Input DTO for GetBrokerActionCalendar use case
 */
export interface GetBrokerActionCalendarInput {
  symbol: string;
  brokers: string[];
  from: string;
  to: string;
}

/**
 * Broker data for a specific date
 */
export interface BrokerActionData {
  value: number;
  value_formatted: string;
  volume: number;
  volume_formatted: string;
}

/**
 * Signal data for a specific date
 */
export interface SignalData {
  trend: string;
  strength: string;
  note: string;
}

/**
 * Date data in the calendar
 */
export interface CalendarDateData {
  date: string;
  close_price: number;
  close_price_formatted: string;
  total_value: number;
  total_value_formatted: string;
  total_volume: number;
  total_volume_formatted: string;
  signal: SignalData;
  brokers: Record<string, BrokerActionData>;
}

/**
 * Price movement data
 */
export interface PriceMovement {
  from: number;
  to: number;
  change: number;
  change_pct: number;
}

/**
 * Summary data
 */
export interface CalendarSummary {
  total_buy_value: number;
  total_buy_value_formatted: string;
  total_buy_volume: number;
  total_buy_volume_formatted: string;
  total_sell_value: number;
  total_sell_value_formatted: string;
  total_sell_volume: number;
  total_sell_volume_formatted: string;
  total_value: number;
  total_value_formatted: string;
  total_volume: number;
  total_volume_formatted: string;
  trend: string;
  strength: string;
  dominant_brokers: string[];
  distribution_brokers: string[];
  price_movement: PriceMovement;
  note: string;
}

/**
 * Output DTO for GetBrokerActionCalendar use case
 */
export interface BrokerActionCalendarOutput {
  symbol: string;
  brokers: string[];
  range: {
    from: string;
    to: string;
  };
  summary: CalendarSummary;
  data: CalendarDateData[];
}

/**
 * Use case for getting broker action calendar
 * Orchestrates fetching raw data and transforming it to calendar format
 */
export class GetBrokerActionCalendarUseCase {
  constructor(
    private readonly brokerActionCalendarRepository: IBrokerActionCalendarRepository
  ) {}

  /**
   * Execute the use case
   * @param input - The input parameters
   * @returns Promise resolving to broker action calendar output
   * @throws ValidationError if input is invalid
   */
  async execute(input: GetBrokerActionCalendarInput): Promise<BrokerActionCalendarOutput> {
    this.validateInput(input);

    const { symbol, brokers, from, to } = input;

    const rawCalendar = await this.brokerActionCalendarRepository.getCalendarRaw(
      symbol,
      brokers,
      from,
      to
    );

    const calendarData = this.transformToCalendarData(rawCalendar, brokers);
    const summary = this.calculateSummary(calendarData, brokers);

    return {
      symbol,
      brokers,
      range: { from, to },
      summary,
      data: calendarData,
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: GetBrokerActionCalendarInput): void {
    if (!input.symbol || input.symbol.trim() === "") {
      throw new ValidationError("Missing required parameter: symbol is required");
    }
    if (!input.brokers || input.brokers.length === 0) {
      throw new ValidationError("Missing required parameter: brokers must not be empty");
    }
    for (const broker of input.brokers) {
      BrokerValidator.validateBrokerCode(broker);
    }
    DateValidator.validateDateRange(input.from, input.to);
  }

  /**
   * Calculate summary from calendar data
   */
  private calculateSummary(
    calendarData: CalendarDateData[],
    brokers: string[]
  ): CalendarSummary {
    // Calculate total buy/sell value and volume
    let totalBuyValue = 0;
    let totalBuyVolume = 0;
    let totalSellValue = 0;
    let totalSellVolume = 0;

    for (const data of calendarData) {
      for (const brokerData of Object.values(data.brokers)) {
        if (brokerData.value >= 0) {
          totalBuyValue += brokerData.value;
          totalBuyVolume += brokerData.volume;
        } else {
          totalSellValue += Math.abs(brokerData.value);
          totalSellVolume += Math.abs(brokerData.volume);
        }
      }
    }

    // Calculate net totals
    const totalValue = totalBuyValue - totalSellValue;
    const totalVolume = totalBuyVolume - totalSellVolume;

    // Calculate broker totals
    const brokerTotals: Record<string, number> = {};
    for (const broker of brokers) {
      brokerTotals[broker] = 0;
    }

    for (const data of calendarData) {
      for (const [broker, brokerData] of Object.entries(data.brokers)) {
        if (brokerTotals[broker] !== undefined) {
          brokerTotals[broker] += brokerData.value;
        }
      }
    }

    // Categorize brokers
    const dominantBrokers: string[] = [];
    const distributionBrokers: string[] = [];

    for (const [broker, value] of Object.entries(brokerTotals)) {
      if (value > 0) {
        dominantBrokers.push(broker);
      } else if (value < 0) {
        distributionBrokers.push(broker);
      }
    }

    // Sort by absolute value
    dominantBrokers.sort((a, b) => brokerTotals[b] - brokerTotals[a]);
    distributionBrokers.sort((a, b) => brokerTotals[a] - brokerTotals[b]);

    // Calculate price movement
    const priceMovement = this.calculatePriceMovement(calendarData);

    // Calculate overall trend and strength
    const { trend, strength, note } = this.calculateOverallSignal(
      Object.values(brokerTotals),
      totalValue,
      priceMovement
    );

    return {
      total_buy_value: totalBuyValue,
      total_buy_value_formatted: this.formatNumber(totalBuyValue),
      total_buy_volume: totalBuyVolume,
      total_buy_volume_formatted: this.formatNumber(totalBuyVolume),
      total_sell_value: totalSellValue,
      total_sell_value_formatted: this.formatNumber(totalSellValue),
      total_sell_volume: totalSellVolume,
      total_sell_volume_formatted: this.formatNumber(totalSellVolume),
      total_value: totalValue,
      total_value_formatted: this.formatNumber(totalValue),
      total_volume: totalVolume,
      total_volume_formatted: this.formatNumber(totalVolume),
      trend,
      strength,
      dominant_brokers: dominantBrokers,
      distribution_brokers: distributionBrokers,
      price_movement: priceMovement,
      note,
    };
  }

  /**
   * Calculate price movement from calendar data
   */
  private calculatePriceMovement(calendarData: CalendarDateData[]): PriceMovement {
    if (calendarData.length === 0) {
      return { from: 0, to: 0, change: 0, change_pct: 0 };
    }

    const sortedData = [...calendarData].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const firstPrice = sortedData[0].close_price;
    const lastPrice = sortedData[sortedData.length - 1].close_price;
    const change = lastPrice - firstPrice;
    const change_pct = firstPrice !== 0 ? (change / firstPrice) * 100 : 0;

    return {
      from: firstPrice,
      to: lastPrice,
      change,
      change_pct: Math.round(change_pct * 100) / 100,
    };
  }

  /**
   * Calculate overall signal based on broker values and price movement
   */
  private calculateOverallSignal(
    brokerValues: number[],
    totalValue: number,
    priceMovement: PriceMovement
  ): Omit<SignalData, "note"> & { note: string } {
    const buyValue = brokerValues.filter((v) => v > 0).reduce((sum, v) => sum + v, 0);
    const sellValue = Math.abs(brokerValues.filter((v) => v < 0).reduce((sum, v) => sum + v, 0));

    let trend = "neutral";
    let strength = "weak";
    let note = "Balanced trading activity";

    // Determine trend based on total value flow
    if (totalValue > 0) {
      trend = "accumulation";
      if (buyValue > sellValue * 3) {
        strength = "strong";
      } else if (buyValue > sellValue * 1.5) {
        strength = "moderate";
      }
    } else if (totalValue < 0) {
      trend = "distribution";
      if (sellValue > buyValue * 3) {
        strength = "strong";
      } else if (sellValue > buyValue * 1.5) {
        strength = "moderate";
      }
    }

    // Generate note based on combination of flow and price movement
    note = this.generateSummaryNote(trend, strength, priceMovement, buyValue, sellValue);

    return { trend, strength, note };
  }

  /**
   * Generate summary note based on trend, strength, and price movement
   */
  private generateSummaryNote(
    trend: string,
    strength: string,
    priceMovement: PriceMovement,
    buyValue: number,
    sellValue: number
  ): string {
    const { change_pct: changePct } = priceMovement;

    if (trend === "accumulation") {
      if (strength === "strong" && changePct > 5) {
        return "Strong accumulation phase with significant price gain; smart money aggressively buying";
      } else if (strength === "strong" && changePct < 0) {
        return "Heavy accumulation despite price decline; potential bottom formation";
      } else if (strength === "moderate" && changePct > 0) {
        return "Moderate accumulation with healthy price appreciation";
      } else if (strength === "moderate" && changePct < 0) {
        return "Accumulation phase with mild pullback; smart money still dominant";
      } else {
        return "Weak accumulation detected; market consolidation likely";
      }
    } else if (trend === "distribution") {
      if (strength === "strong" && changePct < -5) {
        return "Heavy distribution with significant price decline; smart money exiting";
      } else if (strength === "strong" && changePct > 0) {
        return "Strong distribution despite price gain; potential distribution pattern";
      } else if (strength === "moderate" && changePct < 0) {
        return "Moderate distribution with declining price trend";
      } else {
        return "Distribution phase with mixed signals; caution advised";
      }
    }

    return "Neutral market conditions; balanced buying and selling pressure";
  }

  /**
   * Transform raw broker action calendar data to calendar format
   */
  private transformToCalendarData(
    rawCalendar: BrokerActionCalendarRaw,
    brokers: string[]
  ): CalendarDateData[] {
    const valueChart = this.getChartByType(rawCalendar.broker_chart_data, "TYPE_CHART_VALUE");
    const volumeChart = this.getChartByType(rawCalendar.broker_chart_data, "TYPE_CHART_VOLUME");

    const resultMap: Record<string, CalendarDateData> = {};

    // Initialize result map with price data
    for (const pricePoint of rawCalendar.price_chart_data) {
      resultMap[pricePoint.date] = {
        date: pricePoint.date,
        close_price: Number(pricePoint.value.raw),
        close_price_formatted: pricePoint.value.formatted,
        total_value: 0,
        total_value_formatted: "",
        total_volume: 0,
        total_volume_formatted: "",
        signal: this.calculateSignal([], 0),
        brokers: {},
      };
    }

    // Add value data
    if (valueChart) {
      for (const brokerChart of valueChart.charts) {
        const brokerCode = brokerChart.broker_code;
        for (const point of brokerChart.chart) {
          if (resultMap[point.date]) {
            const value = Number(point.value.raw);
            resultMap[point.date].brokers[brokerCode] = {
              value,
              value_formatted: point.value.formatted,
              volume: 0,
              volume_formatted: "",
            };
            resultMap[point.date].total_value += value;
          }
        }
      }
    }

    // Add volume data
    if (volumeChart) {
      for (const brokerChart of volumeChart.charts) {
        const brokerCode = brokerChart.broker_code;
        for (const point of brokerChart.chart) {
          if (resultMap[point.date] && resultMap[point.date].brokers[brokerCode]) {
            const volume = Number(point.value.raw);
            resultMap[point.date].brokers[brokerCode].volume = volume;
            resultMap[point.date].brokers[brokerCode].volume_formatted = point.value.formatted;
            resultMap[point.date].total_volume += volume;
          }
        }
      }
    }

    // Format totals and calculate signals
    for (const date of Object.keys(resultMap)) {
      const data = resultMap[date];
      data.total_value_formatted = this.formatNumber(data.total_value);
      data.total_volume_formatted = this.formatNumber(data.total_volume);

      const brokerValues = Object.values(data.brokers).map((b) => b.value);
      data.signal = this.calculateSignal(brokerValues, data.total_value);
    }

    return Object.values(resultMap);
  }

  /**
   * Get chart data by type
   */
  private getChartByType(
    charts: BrokerChartDataByType[],
    type: "TYPE_CHART_VALUE" | "TYPE_CHART_VOLUME"
  ): BrokerChartDataByType | undefined {
    return charts.find((c) => c.type === type);
  }

  /**
   * Calculate signal based on broker values
   */
  private calculateSignal(brokerValues: number[], totalValue: number): SignalData {
    const buyValue = brokerValues.filter((v) => v > 0).reduce((sum, v) => sum + v, 0);
    const sellValue = Math.abs(brokerValues.filter((v) => v < 0).reduce((sum, v) => sum + v, 0));

    let trend = "neutral";
    let strength = "weak";
    let note = "Balanced trading activity";

    if (totalValue > 0) {
      trend = "accumulation";
      if (buyValue > sellValue * 3) {
        strength = "strong";
        note = "Strong breakout with heavy institutional accumulation";
      } else if (buyValue > sellValue * 1.5) {
        strength = "moderate";
        note = "Pullback with sustained buying interest";
      } else {
        strength = "weak";
        note = "Mild accumulation detected";
      }
    } else if (totalValue < 0) {
      trend = "distribution";
      if (sellValue > buyValue * 3) {
        strength = "strong";
        note = "Heavy institutional selling pressure";
      } else if (sellValue > buyValue * 1.5) {
        strength = "moderate";
        note = "Selling pressure dominant, early distribution";
      } else {
        strength = "weak";
        note = "Mild distribution detected";
      }
    }

    return { trend, strength, note };
  }

  /**
   * Format number to formatted string
   */
  private formatNumber(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? "(" : "";
    const suffix = value < 0 ? ")" : "";

    if (abs >= 1_000_000_000) {
      return `${sign}${(abs / 1_000_000_000).toFixed(1)}B${suffix}`;
    } else if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(1)}M${suffix}`;
    } else if (abs >= 1_000) {
      return `${sign}${(abs / 1_000).toFixed(1)}K${suffix}`;
    }
    return `${sign}${abs.toFixed(1)}${suffix}`;
  }
}
