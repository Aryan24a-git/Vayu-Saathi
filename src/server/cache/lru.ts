interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface LruOptions {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}

export class LruCache<K, V> {
  private readonly entries = new Map<K, CacheEntry<V>>();

  constructor(private readonly options: LruOptions) {}

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    const now = this.options.now ? this.options.now() : Date.now();
    if (now >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    this.evictExpired();
    this.entries.delete(key);
    while (this.entries.size >= this.options.maxEntries) {
      const oldest = this.entries.keys().next().value as K | undefined;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    this.entries.set(key, {
      value,
      expiresAt: (this.options.now ? this.options.now() : Date.now()) + this.options.ttlMs,
    });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  private evictExpired(): void {
    const now = this.options.now ? this.options.now() : Date.now();
    for (const [key, entry] of this.entries) {
      if (now >= entry.expiresAt) this.entries.delete(key);
    }
  }
}

export class RequestCoalescer<K, V> {
  private readonly inflight = new Map<K, Promise<V>>();

  get(key: K, fetcher: () => Promise<V>): Promise<V> {
    const existing = this.inflight.get(key);
    if (existing) return existing;
    const promise = fetcher().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.inflight.clear();
  }

  get size(): number {
    return this.inflight.size;
  }
}
