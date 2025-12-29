import { GetAllBrokersUseCase } from "../../../application/usecases";
import { Broker } from "../../../domain/entities";
import { errorToResponse } from "../errors";

/**
 * Controller for broker endpoints
 * Handles HTTP request/response and delegates to use cases
 */
export class BrokersController {
  constructor(private readonly getAllBrokersUseCase: GetAllBrokersUseCase) {}

  /**
   * GET /api/v1/brokers
   * Get all available brokers
   */
  async getAllBrokers(): Promise<Response> {
    try {
      const brokers = await this.getAllBrokersUseCase.execute();

      return Response.json({
        data: brokers.map((b) => b.toDTO()),
      });
    } catch (error) {
      return errorToResponse(error);
    }
  }
}
