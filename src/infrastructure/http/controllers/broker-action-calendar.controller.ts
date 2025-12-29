import { GetBrokerActionCalendarUseCase } from "../../../application/usecases";
import { ValidationError } from "../errors";
import { errorToResponse } from "../errors";

/**
 * Controller for broker action calendar endpoint
 */
export class BrokerActionCalendarController {
  constructor(
    private readonly getBrokerActionCalendarUseCase: GetBrokerActionCalendarUseCase
  ) {}

  /**
   * GET /api/v1/broker-action-calendar
   * Get broker action calendar
   */
  async getBrokerActionCalendar(req: Request): Promise<Response> {
    try {
      const input = this.extractInput(req);
      this.validateQueryParams(input);

      const result = await this.getBrokerActionCalendarUseCase.execute(input);

      return Response.json({
        symbol: result.symbol,
        brokers: result.brokers,
        range: result.range,
        summary: result.summary,
        data: result.data,
      });
    } catch (error) {
      return errorToResponse(error);
    }
  }

  /**
   * Extract input from request URL
   */
  private extractInput(req: Request): {
    symbol: string;
    brokers: string[];
    from: string;
    to: string;
  } {
    const url = new URL(req.url);
    return {
      symbol: url.searchParams.get("symbol") || "",
      brokers: url.searchParams.getAll("broker_code"),
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
    };
  }

  /**
   * Validate required query parameters
   */
  private validateQueryParams(input: {
    symbol: string;
    brokers: string[];
    from: string;
    to: string;
  }): void {
    if (!input.symbol || !input.from || !input.to) {
      throw new ValidationError(
        "Missing required query parameters: symbol, broker_code (can be multiple), from, and to are required"
      );
    }
    if (!input.brokers || input.brokers.length === 0) {
      throw new ValidationError(
        "Missing required query parameter: at least one broker_code is required"
      );
    }
  }
}
