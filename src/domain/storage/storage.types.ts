/**
 * Configuration options for in-memory storage
 */
export interface InMemoryStorageOptions {
  /**
   * Maximum number of items to store (0 = unlimited)
   */
  maxSize?: number;

  /**
   * Default TTL in milliseconds (0 = no expiration)
   */
  defaultTTL?: number;

  /**
   * Cleanup interval in milliseconds for expired items
   */
  cleanupInterval?: number;

  /**
   * Enable automatic cleanup of expired items
   */
  autoCleanup?: boolean;

  /**
   * Called when an item is evicted due to maxSize
   */
  onEvict?: (key: string, value: unknown) => void;

  /**
   * Called when an item expires
   */
  onExpire?: (key: string, value: unknown) => void;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  size: number;
  keys: number;
  expired: number;
  memoryUsage: number;
}

/**
 * Storage event types
 */
export type StorageEventType = 'set' | 'delete' | 'clear' | 'expire' | 'evict';

/**
 * Storage event listener
 */
export type StorageEventListener<T> = (event: StorageEvent<T>) => void;

/**
 * Storage event
 */
export interface StorageEvent<T> {
  type: StorageEventType;
  key: string;
  value?: T;
  timestamp: number;
}

/**
 * Query options for filtering
 */
export interface QueryOptions<T> {
  /**
   * Filter predicate
   */
  filter?: (value: T) => boolean;

  /**
   * Sort comparator
   */
  sort?: (a: T, b: T) => number;

  /**
   * Maximum number of results
   */
  limit?: number;

  /**
   * Number of results to skip
   */
  offset?: number;
}

/**
 * Aggregation options
 */
export interface AggregateOptions<T> {
  /**
   * Group by key function
   */
  groupBy?: (value: T) => string;

  /**
   * Reduce function
   */
  reduce?: (acc: Record<string, unknown>, value: T) => Record<string, unknown>;
}
