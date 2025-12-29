/**
 * Generic in-memory storage interface
 * Provides CRUD operations for any entity type
 */
export interface IInMemoryStorage<T, K = string> {
  /**
   * Get all stored items
   */
  getAll(): T[];

  /**
   * Get an item by its key
   * @param key - The unique identifier
   */
  get(key: K): T | undefined;

  /**
   * Check if an item exists
   * @param key - The unique identifier
   */
  has(key: K): boolean;

  /**
   * Add or update an item
   * @param key - The unique identifier
   * @param value - The value to store
   */
  set(key: K, value: T): void;

  /**
   * Delete an item by its key
   * @param key - The unique identifier
   * @returns true if the item was deleted, false if it didn't exist
   */
  delete(key: K): boolean;

  /**
   * Clear all items from storage
   */
  clear(): void;

  /**
   * Get the number of items in storage
   */
  size(): number;

  /**
   * Get all keys in storage
   */
  keys(): K[];

  /**
   * Get all values in storage
   */
  values(): T[];

  /**
   * Find items matching a predicate
   * @param predicate - Function to test each item
   */
  find(predicate: (value: T, key: K) => boolean): T[];

  /**
   * Update an item if it exists
   * @param key - The unique identifier
   * @param updater - Function to transform the existing value
   * @returns true if updated, false if key not found
   */
  update(key: K, updater: (value: T) => T): boolean;

  /**
   * Get or create an item
   * @param key - The unique identifier
   * @param factory - Function to create the value if it doesn't exist
   */
  getOrCreate(key: K, factory: () => T): T;

  /**
   * Set multiple items at once
   * @param entries - Array of [key, value] tuples
   */
  setMany(entries: [K, T][]): void;

  /**
   * Delete multiple items at once
   * @param keys - Array of keys to delete
   * @returns Number of items deleted
   */
  deleteMany(keys: K[]): number;
}

/**
 * Expirable item wrapper for TTL support
 */
export interface ExpirableItem<T> {
  value: T;
  expiresAt: number;
}

/**
 * Storage with TTL (Time To Live) support
 */
export interface IInMemoryStorageWithTTL<T, K = string> extends IInMemoryStorage<ExpirableItem<T>, K> {
  /**
   * Set an item with TTL
   * @param key - The unique identifier
   * @param value - The value to store
   * @param ttlMs - Time to live in milliseconds
   */
  setWithTTL(key: K, value: T, ttlMs: number): void;

  /**
   * Clean up expired items
   * @returns Number of items removed
   */
  cleanup(): number;

  /**
   * Get an item without the expirable wrapper
   * @param key - The unique identifier
   */
  getValue(key: K): T | undefined;
}
