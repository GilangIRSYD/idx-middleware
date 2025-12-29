/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the Clean Architecture pattern with repositories and use cases instead.
 *
 * @see ../../infrastructure/repositories
 * @see ../../application/usecases
 */

import type { BrokersResponse, BrokerActivityResponse } from "../types";
import { ApiConfig } from "../config";

const apiConfig = new ApiConfig();

async function fetchMock<T>(path: string): Promise<T> {
  const file = await import(`../../mock${path}.json`) as Promise<{ default: T }>;
  return (await file).default;
}

/**
 * @deprecated Use GetAllBrokersUseCase instead
 */
export async function fetchBrokers(): Promise<BrokersResponse> {
  if (apiConfig.useMock) {
    return fetchMock("/marketdetectors-brokers");
  }
  const res = await fetch(apiConfig.getBrokersUrl(), {
    headers: {
      "Authorization": `Bearer ${apiConfig.accessToken}`
    }
  });

  return res.json()
}

/**
 * @deprecated Use GetBrokerActionSummaryUseCase or GetBrokerEmitenDetailUseCase instead
 */
export async function fetchBrokerActivity(
  broker: string,
  from: string,
  to: string
): Promise<BrokerActivityResponse> {
  if (apiConfig.useMock) {
    return fetchMock("/marketdetectors-activity");
  }

  const url = apiConfig.getBrokerActivityUrl(broker, from, to);

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${apiConfig.accessToken}`
    }
  });
  return res.json();
}
