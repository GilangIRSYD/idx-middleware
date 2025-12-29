/**
 * In-Memory Storage Implementation
 * Thread-safe in-memory storage with TTL support, event emission, and size limits
 */

import type {
  IInMemoryStorage,
  IInMemoryStorageWithTTL,
  ExpirableItem,
} from "../../../domain/storage/storage.interface";
import type {
  InMemoryStorageOptions,
  StorageStats,
  StorageEvent,
  StorageEventType,
  StorageEventListener,
  QueryOptions,
} from "../../../domain/storage/storage.types";

/**
 * Base in-memory storage implementation
 */
export class InMemoryStorage<T, K = string> implements IInMemoryStorage<T, K> {
  protected data: Map<K, T>;
  protected options: Required<InMemoryStorageOptions>;
  protected listeners: Set<StorageEventListener<T>>;

  constructor(options: InMemoryStorageOptions = {}) {
    this.data = new Map();
    this.listeners = new Set();

    this.options = {
      maxSize: options.maxSize ?? 0,
      defaultTTL: options.defaultTTL ?? 0,
      cleanupInterval: options.cleanupInterval ?? 60000,
      autoCleanup: options.autoCleanup ?? false,
      onEvict: options.onEvict ?? (() => {}),
      onExpire: options.onExpire ?? (() => {}),
    };

    if (this.options.autoCleanup && this.options.defaultTTL > 0) {
      this.startCleanupInterval();
    }
  }

  getAll(): T[] {
    return Array.from(this.data.values());
  }

  get(key: K): T | undefined {
    return this.data.get(key);
  }

  has(key: K): boolean {
    return this.data.has(key);
  }

  set(key: K, value: T): void {
    // Enforce max size
    if (this.options.maxSize > 0 && this.data.size >= this.options.maxSize && !this.data.has(key)) {
      // Evict the first item (FIFO)
      const firstKey = this.data.keys().next().value;
      if (firstKey !== undefined) {
        const evictedValue = this.data.get(firstKey);
        this.data.delete(firstKey);
        this.options.onEvict(String(firstKey), evictedValue);
        this.emit({ type: 'evict', key: String(firstKey), value: evictedValue, timestamp: Date.now() });
      }
    }

    this.data.set(key, value);
    this.emit({ type: 'set', key: String(key), value, timestamp: Date.now() });
  }

  delete(key: K): boolean {
    const existed = this.data.delete(key);
    if (existed) {
      this.emit({ type: 'delete', key: String(key), timestamp: Date.now() });
    }
    return existed;
  }

  clear(): void {
    const size = this.data.size;
    this.data.clear();
    this.emit({ type: 'clear', key: '', timestamp: Date.now() });
  }

  size(): number {
    return this.data.size;
  }

  keys(): K[] {
    return Array.from(this.data.keys());
  }

  values(): T[] {
    return Array.from(this.data.values());
  }

  find(predicate: (value: T, key: K) => boolean): T[] {
    return this.getAll().filter((value, _, map) => {
      const key = Array.from(this.data.keys())[this.getAll().indexOf(value)];
      return predicate(value, key as K);
    });
  }

  update(key: K, updater: (value: T) => T): boolean {
    const value = this.data.get(key);
    if (value === undefined) {
      return false;
    }
    this.data.set(key, updater(value));
    return true;
  }

  getOrCreate(key: K, factory: () => T): T {
    if (!this.data.has(key)) {
      this.data.set(key, factory());
    }
    return this.data.get(key)!;
  }

  setMany(entries: [K, T][]): void {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  deleteMany(keys: K[]): number {
    let deleted = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Query items with options
   */
  query(options: QueryOptions<T>): T[] {
    let results = this.getAll();

    if (options.filter) {
      results = results.filter(options.filter);
    }

    if (options.sort) {
      results.sort(options.sort);
    }

    if (options.offset) {
      results = results.slice(options.offset);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    return {
      size: this.data.size,
      keys: this.data.size,
      expired: 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Subscribe to storage events
   */
  on(listener: StorageEventListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected emit(event: StorageEvent<T>): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in storage event listener:', error);
      }
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation in bytes
    let bytes = 0;
    for (const [key, value] of this.data) {
      bytes += String(key).length * 2; // UTF-16
      bytes += JSON.stringify(value).length * 2;
    }
    return bytes;
  }

  private startCleanupInterval(): void {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        // Base implementation doesn't expire items, override in TTL version
      }, this.options.cleanupInterval);
    }
  }
}

/**
 * In-Memory Storage with TTL support
 */
export class InMemoryStorageWithTTL<T, K = string>
  extends InMemoryStorage<ExpirableItem<T>, K>
  implements IInMemoryStorageWithTTL<T, K>
{
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: InMemoryStorageOptions = {}) {
    super(options);

    if (this.options.autoCleanup && this.options.cleanupInterval > 0) {
      this.startCleanup();
    }
  }

  setWithTTL(key: K, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.set(key, { value, expiresAt });
  }

  getValue(key: K): T | undefined {
    const item = this.get(key);
    if (!item) {
      return undefined;
    }

    if (this.isExpired(item)) {
      this.delete(key);
      this.options.onExpire(String(key), item.value);
      this.emit({ type: 'expire', key: String(key), value: item.value, timestamp: Date.now() });
      return undefined;
    }

    return item.value;
  }

  get(key: K): ExpirableItem<T> | undefined {
    const item = super.get(key);
    if (!item) {
      return undefined;
    }

    if (this.isExpired(item)) {
      this.delete(key);
      this.options.onExpire(String(key), item.value);
      this.emit({ type: 'expire', key: String(key), value: item.value, timestamp: Date.now() });
      return undefined;
    }

    return item;
  }

  set(key: K, value: ExpirableItem<T>): void {
    super.set(key, value);
  }

  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, item] of this.data) {
      if (item.expiresAt <= now) {
        this.data.delete(key);
        this.options.onExpire(String(key), item.value);
        this.emit({ type: 'expire', key: String(key), value: item.value, timestamp: now });
        removed++;
      }
    }

    return removed;
  }

  getAll(): ExpirableItem<T>[] {
    // Filter out expired items
    const items = super.getAll();
    const now = Date.now();
    return items.filter(item => item.expiresAt > now);
  }

  getStats(): StorageStats {
    const now = Date.now();
    let expired = 0;

    for (const item of this.data.values()) {
      if (item.expiresAt <= now) {
        expired++;
      }
    }

    return {
      size: this.data.size,
      keys: this.data.size,
      expired,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Start automatic cleanup
   */
  startCleanup(): void {
    this.stopCleanup();

    if (this.options.cleanupInterval > 0 && typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.options.cleanupInterval);
    }
  }

  private isExpired(item: ExpirableItem<T>): boolean {
    return item.expiresAt <= Date.now();
  }
}
