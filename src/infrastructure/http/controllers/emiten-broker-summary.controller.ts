import { GetEmitenBrokerSummaryUseCase } from "../../../application/usecases";
import { ValidationError } from "../errors";
import { errorToResponse } from "../errors";

/**
 * Controller for emiten broker summary endpoint
 */
export class EmitenBrokerSummaryController {
  constructor(
    private readonly getEmitenBrokerSummaryUseCase: GetEmitenBrokerSummaryUseCase
  ) {}

  /**
   * GET /api/v1/emiten-broker-summary
   * Get broker summary for a specific emiten
   */
  async getEmitenBrokerSummary(req: Request): Promise<Response> {
    try {
      const input = this.extractInput(req);
      this.validateQueryParams(input);

      const result = await this.getEmitenBrokerSummaryUseCase.execute(input);

      return Response.json(result);
    } catch (error) {
      return errorToResponse(error);
    }
  }

  /**
   * Extract input from request URL
   */
  private extractInput(req: Request): {
    symbol: string;
    from: string;
    to: string;
  } {
    const url = new URL(req.url);
    return {
      symbol: url.searchParams.get("symbol") || "",
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
    };
  }

  /**
   * Validate required query parameters
   */
  private validateQueryParams(input: {
    symbol: string;
    from: string;
    to: string;
  }): void {
    if (!input.symbol || !input.from || !input.to) {
      throw new ValidationError(
        "Missing required query parameters: symbol, from, and to are required"
      );
    }
  }
}
