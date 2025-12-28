import { GetAllBrokersUseCase } from "../../../application/usecases";
import { Broker } from "../../../domain/entities";

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
      console.error("Error in getAllBrokers:", error);
      return Response.json(
        {
          error: "Failed to fetch brokers",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
}
