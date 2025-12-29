/**
 * Config Storage Implementation
 * In-memory storage for application configuration
 */

import type { ConfigStorage } from "../../domain/usecases/config.usecase";
import { InMemoryStorage } from "./in-memory-storage.impl";

export class ConfigStorageImpl implements ConfigStorage {
  private static readonly ACCESS_TOKEN_KEY = "config:access_token";
  private storage: InMemoryStorage<string, string>;

  constructor() {
    this.storage = new InMemoryStorage();
  }

  setAccessToken(token: string): void {
    this.storage.set(ConfigStorageImpl.ACCESS_TOKEN_KEY, token);
  }

  getAccessToken(): string | null {
    return this.storage.get(ConfigStorageImpl.ACCESS_TOKEN_KEY) ?? null;
  }

  deleteAccessToken(): void {
    this.storage.delete(ConfigStorageImpl.ACCESS_TOKEN_KEY);
  }
}
