/**
 * Config use case for managing application configuration
 */

export class SetAccessTokenUseCase {
  constructor(private readonly configStorage: ConfigStorage) {}

  execute(token: string): { success: boolean; message: string } {
    this.configStorage.setAccessToken(token);
    return {
      success: true,
      message: "Access token updated successfully",
    };
  }
}

export class GetAccessTokenUseCase {
  constructor(private readonly configStorage: ConfigStorage) {}

  execute(): { token: string | null } {
    return {
      token: this.configStorage.getAccessToken(),
    };
  }
}

export class DeleteAccessTokenUseCase {
  constructor(private readonly configStorage: ConfigStorage) {}

  execute(): { success: boolean; message: string } {
    this.configStorage.deleteAccessToken();
    return {
      success: true,
      message: "Access token deleted successfully",
    };
  }
}

/**
 * Config storage interface
 */
export interface ConfigStorage {
  setAccessToken(token: string): void;
  getAccessToken(): string | null;
  deleteAccessToken(): void;
}
