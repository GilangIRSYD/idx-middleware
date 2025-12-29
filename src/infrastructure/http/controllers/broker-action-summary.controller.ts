import { GetBrokerActionSummaryUseCase } from "../../../application/usecases";
import { ValidationError } from "../errors";
import { errorToResponse } from "../errors";

/**
 * Controller for broker action summary endpoint
 */
export class BrokerActionSummaryController {
  constructor(
    private readonly getBrokerActionSummaryUseCase: GetBrokerActionSummaryUseCase
  ) {}

  /**
   * GET /api/v1/broker-action-summary
   * Get broker activity summary
   */
  async getBrokerActionSummary(req: Request): Promise<Response> {
    try {
      const input = this.extractInput(req);
      this.validateQueryParams(input);

      const result = await this.getBrokerActionSummaryUseCase.execute(input);

      return Response.json({
        broker: result.broker,
        period: result.period,
        data: result.data.map((e) => e.toDTO()),
      });
    } catch (error) {
      return errorToResponse(error);
    }
  }

  /**
   * Extract input from request URL
   */
  private extractInput(req: Request): { broker: string; from: string; to: string } {
    const url = new URL(req.url);
    return {
      broker: url.searchParams.get("broker") || "",
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
    };
  }

  /**
   * Validate required query parameters
   */
  private validateQueryParams(input: { broker: string; from: string; to: string }): void {
    if (!input.broker || !input.from || !input.to) {
      throw new ValidationError(
        "Missing required query parameters: broker, from, and to are required"
      );
    }
  }
}
