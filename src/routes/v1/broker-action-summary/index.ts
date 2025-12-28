import { fetchBrokerActivity } from "../../../services/stockbit.service";
import { transformBrokerSummary } from "../../../utils/transform";

export async function getBrokerSummary(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const broker = url.searchParams.get("broker") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const raw = await fetchBrokerActivity(broker, from, to);
  const summary = transformBrokerSummary(raw);

  return Response.json({
    broker,
    period: { from, to },
    data: summary
  });
}
