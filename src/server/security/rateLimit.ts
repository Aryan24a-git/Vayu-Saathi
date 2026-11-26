import { createHash, randomUUID } from 'crypto';
import { getEnv } from '../config/env';

export interface BucketStore {
  get(key: string): TokenBucket | undefined;
  set(key: string, value: TokenBucket): void;
}

export interface TokenBucket {
  tokens: number;
  lastRefillMs: number;
}

export class MemoryBucketStore implements BucketStore {
  private readonly buckets = new Map<string, TokenBucket>();

  get(key: string): TokenBucket | undefined {
    return this.buckets.get(key);
  }

  set(key: string, value: TokenBucket): void {
    this.buckets.set(key, value);
  }

  clear(): void {
    this.buckets.clear();
  }
}

export class TokenBucketLimiter {
  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
    private readonly store: BucketStore = new MemoryBucketStore()
  ) {}

  check(key: string, nowMs = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    const bucket = this.store.get(key) ?? { tokens: this.limit, lastRefillMs: nowMs };
    const elapsed = Math.max(0, nowMs - bucket.lastRefillMs);
    const refill = (elapsed / this.windowMs) * this.limit;
    bucket.tokens = Math.min(this.limit, bucket.tokens + refill);
    bucket.lastRefillMs = nowMs;
    if (bucket.tokens < 1) {
      this.store.set(key, bucket);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(((1 - bucket.tokens) * this.windowMs) / this.limit / 1000)
        ),
      };
    }
    bucket.tokens -= 1;
    this.store.set(key, bucket);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

const salt = getEnv().CLIENT_IP_SALT || randomUUID();

export function getHashedClientKey(req: Request): string {
  const env = getEnv();
  const raw = req.headers.get(env.TRUSTED_PROXY_HEADER)?.split(',')[0]?.trim();
  const ip = raw && raw.length <= 100 ? raw : 'unknown';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
