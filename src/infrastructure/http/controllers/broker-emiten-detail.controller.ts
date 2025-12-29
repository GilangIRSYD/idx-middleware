import { GetBrokerEmitenDetailUseCase } from "../../../application/usecases";
import { ValidationError } from "../errors";
import { errorToResponse } from "../errors";

/**
 * Controller for broker emiten detail endpoint
 */
export class BrokerEmitenDetailController {
  constructor(
    private readonly getBrokerEmitenDetailUseCase: GetBrokerEmitenDetailUseCase
  ) {}

  /**
   * GET /api/v1/broker-emiten-detail
   * Get broker emiten detail
   */
  async getBrokerEmitenDetail(req: Request): Promise<Response> {
    try {
      const input = this.extractInput(req);
      this.validateQueryParams(input);

      const result = await this.getBrokerEmitenDetailUseCase.execute(input);

      return Response.json({
        broker: result.broker,
        emiten: result.emiten,
        period: result.period,
        calendar: result.calendar.map((e) => e.toDTO()),
      });
    } catch (error) {
      return errorToResponse(error);
    }
  }

  /**
   * Extract input from request URL
   */
  private extractInput(req: Request): {
    broker: string;
    emiten: string;
    from: string;
    to: string;
  } {
    const url = new URL(req.url);
    return {
      broker: url.searchParams.get("broker") || "",
      emiten: url.searchParams.get("emiten") || "",
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
    };
  }

  /**
   * Validate required query parameters
   */
  private validateQueryParams(input: {
    broker: string;
    emiten: string;
    from: string;
    to: string;
  }): void {
    if (!input.broker || !input.emiten || !input.from || !input.to) {
      throw new ValidationError(
        "Missing required query parameters: broker, emiten, from, and to are required"
      );
    }
  }
}
