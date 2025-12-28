import { GetBrokerEmitenDetailUseCase } from "../../../application/usecases";

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
      const url = new URL(req.url);
      const broker = url.searchParams.get("broker") || "";
      const emiten = url.searchParams.get("emiten") || "";
      const from = url.searchParams.get("from") || "";
      const to = url.searchParams.get("to") || "";

      // Validate required parameters
      if (!broker || !emiten || !from || !to) {
        return Response.json(
          {
            error: "Missing required parameters",
            message: "broker, emiten, from, and to query parameters are required",
          },
          { status: 400 }
        );
      }

      const result = await this.getBrokerEmitenDetailUseCase.execute({
        broker,
        emiten,
        from,
        to,
      });

      return Response.json({
        broker: result.broker,
        emiten: result.emiten,
        period: result.period,
        calendar: result.calendar.map((e) => e.toDTO()),
      });
    } catch (error) {
      console.error("Error in getBrokerEmitenDetail:", error);
      return Response.json(
        {
          error: "Failed to fetch broker emiten detail",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
}
