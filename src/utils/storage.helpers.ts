/**
 * Storage Helper Utilities
 * Collection of utility functions for common in-memory storage operations
 */

import type { IInMemoryStorage, IInMemoryStorageWithTTL } from "../domain/storage/storage.interface";
import type { QueryOptions } from "../domain/storage/storage.types";

/**
 * Create a cached version of an async function
 * Results are cached in the provided storage with optional TTL
 */
export function cachedFunction<
  Args extends unknown[],
  Result,
  K = string
>(
  storage: IInMemoryStorageWithTTL<Result, K>,
  keyFn: (...args: Args) => K,
  fn: (...args: Args) => Promise<Result>,
  ttlMs: number = 60000 // Default 1 minute
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    const key = keyFn(...args);
    const cached = storage.getValue(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    storage.setWithTTL(key, result, ttlMs);
    return result;
  };
}

/**
 * Create a memoized version of a synchronous function
 */
export function memoizedFunction<
  Args extends unknown[],
  Result,
  K = string
>(
  storage: IInMemoryStorage<Result, K>,
  keyFn: (...args: Args) => K,
  fn: (...args: Args) => Result
): (...args: Args) => Result {
  return (...args: Args): Result => {
    const key = keyFn(...args);
    return storage.getOrCreate(key, () => fn(...args));
  };
}

/**
 * Batch operation helper
 * Execute multiple operations and return results
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Pagination helper for storage queries
 */
export function paginate<T>(
  storage: IInMemoryStorage<T, string>,
  options: QueryOptions<T> = {}
): {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const allData = storage.getAll();
  let filteredData = allData;

  // Apply filter
  if (options.filter) {
    filteredData = allData.filter(options.filter);
  }

  // Apply sort
  if (options.sort) {
    filteredData = [...filteredData].sort(options.sort);
  }

  const total = filteredData.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? filteredData.length;

  const paginatedData = filteredData.slice(offset, offset + limit);

  return {
    data: paginatedData,
    total,
    page: Math.floor(offset / (options.limit ?? total)) + 1,
    pageSize: limit,
    hasNext: offset + limit < total,
    hasPrev: offset > 0,
  };
}

/**
 * Search helper with fuzzy matching
 */
export function search<T>(
  storage: IInMemoryStorage<T, string>,
  searchTerm: string,
  selector: (item: T) => string = (item) => String(item),
  fuzzy: boolean = false
): T[] {
  const term = searchTerm.toLowerCase();

  return storage.getAll().filter((item) => {
    const value = selector(item).toLowerCase();

    if (fuzzy) {
      // Simple fuzzy match - all characters must exist in order
      let searchIndex = 0;
      for (const char of value) {
        if (char === term[searchIndex]) {
          searchIndex++;
        }
        if (searchIndex === term.length) {
          return true;
        }
      }
      return false;
    }

    return value.includes(term);
  });
}

/**
 * Aggregation helper
 */
export function aggregate<T>(
  storage: IInMemoryStorage<T, string>,
  groupBy: (item: T) => string,
  aggregateFn: (items: T[]) => unknown = (items) => items.length
): Record<string, unknown> {
  const groups = new Map<string, T[]>();

  for (const item of storage.getAll()) {
    const key = groupBy(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  const result: Record<string, unknown> = {};
  for (const [key, items] of groups) {
    result[key] = aggregateFn(items);
  }

  return result;
}

/**
 * Rate limiter using storage
 */
export class RateLimiter {
  constructor(
    private storage: IInMemoryStorageWithTTL<number[], string>,
    private maxRequests: number,
    private windowMs: number
  ) {}

  /**
   * Check if a request is allowed for the given identifier
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing timestamps or create new array
    let timestamps = this.storage.getValue(identifier);

    if (!timestamps) {
      timestamps = [];
    }

    // Filter out old timestamps
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if under limit
    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      this.storage.setWithTTL(identifier, timestamps, this.windowMs);
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for the identifier
   */
  getRemaining(identifier: string): number {
    const timestamps = this.storage.getValue(identifier);
    if (!timestamps) {
      return this.maxRequests;
    }

    const windowStart = Date.now() - this.windowMs;
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  /**
   * Get reset time for the identifier
   */
  getResetTime(identifier: string): number | null {
    const timestamps = this.storage.getValue(identifier);
    if (!timestamps || timestamps.length === 0) {
      return null;
    }

    return timestamps[0] + this.windowMs;
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(
  storage: IInMemoryStorageWithTTL<number[], string>,
  maxRequests: number,
  windowMs: number
): RateLimiter {
  return new RateLimiter(storage, maxRequests, windowMs);
}

/**
 * Semaphore for limiting concurrent operations
 */
export class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquire a permit, returns a promise that resolves when permit is available
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Release a permit
   */
  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve?.();
    } else {
      this.permits++;
    }
  }

  /**
   * Execute a function with a permit
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Create a semaphore instance
 */
export function createSemaphore(permits: number): Semaphore {
  return new Semaphore(permits);
}

/**
 * Debounce helper for storage operations
 */
export function createDebounce<T>(
  storage: IInMemoryStorage<T, string>,
  key: string,
  delayMs: number,
  valueFn: () => T
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      storage.set(key, valueFn());
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle helper for storage operations
 */
export function createThrottle<T>(
  storage: IInMemoryStorage<T, string>,
  key: string,
  intervalMs: number,
  valueFn: () => T
): () => void {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return () => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;

    if (timeSinceLastRun >= intervalMs) {
      storage.set(key, valueFn());
      lastRun = now;
    } else if (!timeoutId) {
      const delay = intervalMs - timeSinceLastRun;
      timeoutId = setTimeout(() => {
        storage.set(key, valueFn());
        lastRun = Date.now();
        timeoutId = null;
      }, delay);
    }
  };
}

/**
 * Clone storage to a new storage instance
 */
export function cloneStorage<T>(
  source: IInMemoryStorage<T, string>,
  destination: IInMemoryStorage<T, string>
): void {
  for (const key of source.keys()) {
    const value = source.get(key);
    if (value !== undefined) {
      destination.set(key, value);
    }
  }
}

/**
 * Merge multiple storages into one
 */
export function mergeStorages<T>(
  storages: IInMemoryStorage<T, string>[],
  result: IInMemoryStorage<T, string>
): void {
  for (const storage of storages) {
    cloneStorage(storage, result);
  }
}

/**
 * Export storage to JSON
 */
export function exportToJSON<T>(storage: IInMemoryStorage<T, string>): string {
  const data = storage.getAll();
  return JSON.stringify(data, null, 2);
}

/**
 * Import storage from JSON
 */
export function importFromJSON<T>(
  storage: IInMemoryStorage<T, string>,
  json: string,
  keyFn: (item: T) => string
): void {
  const data = JSON.parse(json) as T[];
  storage.clear();

  for (const item of data) {
    storage.set(keyFn(item), item);
  }
}

/**
 * Create a storage key from multiple parts
 */
export function createStorageKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

/**
 * Parse a storage key into parts
 */
export function parseStorageKey(key: string, separator: string = ':'): string[] {
  return key.split(separator);
}
