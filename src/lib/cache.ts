// Satisfies: PERF-002, PERF-003, PERF-004
// LRU cache with TTL and bounded memory.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LruCache<K, V> {
  private readonly cache: Map<K, CacheEntry<V>>;
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(options: { maxEntries: number; ttlMs: number }) {
    this.cache = new Map();
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    this.evictExpired();

    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) this.cache.delete(key);
    });
  }
}

/** In-flight request coalescing to prevent duplicate calls (PERF-002) */
export class RequestCoalescer<K extends string, V> {
  private readonly inflight = new Map<K, Promise<V>>();

  async get(key: K, fetcher: () => Promise<V>): Promise<V> {
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = fetcher().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, promise);
    return promise;
  }
}
