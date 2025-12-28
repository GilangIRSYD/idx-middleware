import { fetchBrokerActivity } from "../../../services/stockbit.service";
import { transformEmitenDetail } from "../../../utils/transform";

export async function getBrokerEmitenDetail(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const broker = url.searchParams.get("broker") || "";
  const emiten = url.searchParams.get("emiten") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const raw = await fetchBrokerActivity(broker, from, to);
  const detail = transformEmitenDetail(raw, emiten);

  return Response.json({
    broker,
    emiten,
    period: { from, to },
    calendar: [detail]
  });
}
