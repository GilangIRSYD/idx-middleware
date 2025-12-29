/**
 * Config Controller
 * Handles HTTP requests for configuration management
 */

import {
  SetAccessTokenUseCase,
  GetAccessTokenUseCase,
  DeleteAccessTokenUseCase,
} from "../../../domain/usecases/config.usecase";
import { AppError } from "../errors";

export class ConfigController {
  constructor(
    private readonly setAccessTokenUseCase: SetAccessTokenUseCase,
    private readonly getAccessTokenUseCase: GetAccessTokenUseCase,
    private readonly deleteAccessTokenUseCase: DeleteAccessTokenUseCase
  ) {}

  /**
   * POST /api/v1/config/access-token
   * Set or update the access token
   */
  async setAccessToken(req: Request): Promise<Response> {
    try {
      const body = await req.json();

      if (!body || typeof body.token !== "string") {
        return AppError.badRequest("Token is required and must be a string").toResponse();
      }

      const token = body.token.trim();

      if (token.length === 0) {
        return AppError.badRequest("Token cannot be empty").toResponse();
      }

      const result = this.setAccessTokenUseCase.execute(token);
      return Response.json(result, { status: 200 });
    } catch (error) {
      return AppError.internal("Failed to set access token").toResponse();
    }
  }

  /**
   * GET /api/v1/config/access-token
   * Get the current access token (masked for security)
   */
  async getAccessToken(): Promise<Response> {
    try {
      const result = this.getAccessTokenUseCase.execute();

      // Mask the token for security - only show first and last 4 characters
      const maskedToken = result.token
        ? `${result.token.slice(0, 4)}...${result.token.slice(-4)}`
        : null;

      return Response.json(
        {
          token: maskedToken,
          isSet: result.token !== null,
        },
        { status: 200 }
      );
    } catch (error) {
      return AppError.internal("Failed to get access token").toResponse();
    }
  }

  /**
   * DELETE /api/v1/config/access-token
   * Delete the access token
   */
  async deleteAccessToken(): Promise<Response> {
    try {
      const result = this.deleteAccessTokenUseCase.execute();
      return Response.json(result, { status: 200 });
    } catch (error) {
      return AppError.internal("Failed to delete access token").toResponse();
    }
  }
}
