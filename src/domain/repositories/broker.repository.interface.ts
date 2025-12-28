import { Broker } from "../entities";

/**
 * Repository interface for broker data access
 * This defines the contract that any implementation must follow
 */
export interface IBrokerRepository {
  /**
   * Get all available brokers
   * @returns Promise resolving to array of Broker entities
   */
  getAll(): Promise<Broker[]>;

  /**
   * Get a specific broker by code
   * @param code - The broker code
   * @returns Promise resolving to the Broker entity or null if not found
   */
  getByCode(code: string): Promise<Broker | null>;
}
