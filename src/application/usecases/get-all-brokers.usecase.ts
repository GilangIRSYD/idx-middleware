import { IBrokerRepository } from "../../domain/repositories";
import { Broker } from "../../domain/entities";

/**
 * Use case for retrieving all brokers
 * This orchestrates the business logic for getting broker data
 */
export class GetAllBrokersUseCase {
  constructor(private readonly brokerRepository: IBrokerRepository) {}

  /**
   * Execute the use case
   * @returns Promise resolving to array of Broker entities
   */
  async execute(): Promise<Broker[]> {
    return this.brokerRepository.getAll();
  }
}
