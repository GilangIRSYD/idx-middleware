import type {
  Broker,
  BrokersResponse,
  BrokerActivityResponse,
  EmitenSummary,
  EmitenDetail
} from "../types";

export function normalizeBrokerList(source: BrokersResponse): Broker[] {
  return source.data.map((b) => ({
    code: b.code,
    name: b.name,
    group: b.group
  }));
}

export function transformBrokerSummary(source: BrokerActivityResponse): EmitenSummary[] {
  const map: Record<string, EmitenSummary> = {};

  const buyList = source.data.broker_summary.brokers_buy || [];
  const sellList = source.data.broker_summary.brokers_sell || [];

  for (const b of buyList) {
    const code = b.netbs_stock_code;

    if (!map[code]) {
      map[code] = {
        emiten: code,
        buy_volume: 0,
        sell_volume: 0,
        net_volume: 0,
        buy_value: 0,
        sell_value: 0,
        net_value: 0,
        status: "NEUTRAL"
      };
    }

    map[code].buy_volume += Number(b.blot);
    map[code].buy_value += Number(b.bval);
  }

  for (const s of sellList) {
    const code = s.netbs_stock_code;

    if (!map[code]) {
      map[code] = {
        emiten: code,
        buy_volume: 0,
        sell_volume: 0,
        net_volume: 0,
        buy_value: 0,
        sell_value: 0,
        net_value: 0,
        status: "NEUTRAL"
      };
    }

    map[code].sell_volume += Math.abs(Number(s.slot));
    map[code].sell_value += Math.abs(Number(s.sval));
  }

  return Object.values(map).map((row) => {
    const netVolume = row.buy_volume - row.sell_volume;
    const netValue = row.buy_value - row.sell_value;

    return {
      ...row,
      net_volume: netVolume,
      net_value: netValue,
      status:
        netVolume > 0 ? "ACCUMULATION" :
        netVolume < 0 ? "DISTRIBUTION" :
        "NEUTRAL"
    };
  });
}

export function transformEmitenDetail(source: BrokerActivityResponse, emiten: string): EmitenDetail {
  const buyList = source.data.broker_summary.brokers_buy || [];
  const sellList = source.data.broker_summary.brokers_sell || [];

  const buy = buyList.find((x) => x.netbs_stock_code === emiten);
  const sell = sellList.find((x) => x.netbs_stock_code === emiten);

  const buyVol = buy ? Number(buy.blot) : 0;
  const sellVol = sell ? Math.abs(Number(sell.slot)) : 0;

  const buyVal = buy ? Number(buy.bval) : 0;
  const sellVal = sell ? Math.abs(Number(sell.sval)) : 0;

  const netVol = buyVol - sellVol;
  const netVal = buyVal - sellVal;

  return {
    date: source.data.from,
    buy_volume: buyVol,
    sell_volume: sellVol,
    net_volume: netVol,
    buy_value: buyVal,
    sell_value: sellVal,
    net_value: netVal,
    status:
      netVol > 0 ? "ACCUMULATION" :
      netVol < 0 ? "DISTRIBUTION" :
      "NEUTRAL"
  };
}
