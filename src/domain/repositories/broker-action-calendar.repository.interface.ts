/**
 * Raw chart data point from external API
 */
export interface ChartDataPoint {
  date: string;
  time: string;
  value: {
    raw: string;
    formatted: string;
  };
  datetime_label: string;
}

/**
 * Broker chart data
 */
export interface BrokerChart {
  broker_code: string;
  chart: ChartDataPoint[];
}

/**
 * Broker chart data by type
 */
export interface BrokerChartDataByType {
  type: "TYPE_CHART_VALUE" | "TYPE_CHART_VOLUME";
  brokers: string[];
  charts: BrokerChart[];
}

/**
 * Raw broker action calendar data from external API
 */
export interface BrokerActionCalendarRaw {
  from: string;
  to: string;
  data_last_updated: string;
  price_chart_data: ChartDataPoint[];
  broker_chart_data: BrokerChartDataByType[];
  date_session_info: string;
}

/**
 * Repository interface for broker action calendar data access
 */
export interface IBrokerActionCalendarRepository {
  /**
   * Get raw broker action calendar data from external source
   * @param symbol - The stock symbol (e.g., "BULL")
   * @param brokers - Array of broker codes
   * @param from - Start date (format: YYYY-MM-DD)
   * @param to - End date (format: YYYY-MM-DD)
   * @returns Promise resolving to raw broker action calendar data
   */
  getCalendarRaw(
    symbol: string,
    brokers: string[],
    from: string,
    to: string
  ): Promise<BrokerActionCalendarRaw>;
}
