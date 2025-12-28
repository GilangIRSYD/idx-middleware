import { fetchBrokers } from "../../../services/stockbit.service";
import { normalizeBrokerList } from "../../../utils/transform";

export async function getBrokers(req: Request): Promise<Response> {
  const raw = await fetchBrokers();
  const data = normalizeBrokerList(raw);

  return Response.json({ data });
}
