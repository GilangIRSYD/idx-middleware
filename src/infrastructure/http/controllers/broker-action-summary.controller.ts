import { GetBrokerActionSummaryUseCase } from "../../../application/usecases";

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
      const url = new URL(req.url);
      const broker = url.searchParams.get("broker") || "";
      const from = url.searchParams.get("from") || "";
      const to = url.searchParams.get("to") || "";

      // Validate required parameters
      if (!broker || !from || !to) {
        return Response.json(
          {
            error: "Missing required parameters",
            message: "broker, from, and to query parameters are required",
          },
          { status: 400 }
        );
      }

      const result = await this.getBrokerActionSummaryUseCase.execute({
        broker,
        from,
        to,
      });

      return Response.json({
        broker: result.broker,
        period: result.period,
        data: result.data.map((e) => e.toDTO()),
      });
    } catch (error) {
      console.error("Error in getBrokerActionSummary:", error);
      return Response.json(
        {
          error: "Failed to fetch broker action summary",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
}
