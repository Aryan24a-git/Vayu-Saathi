import { LruCache } from '../src/server/cache/lru';

const cache = new LruCache<string, object>({ maxEntries: 500, ttlMs: 15 * 60 * 1000 });
global.gc?.();
const before = process.memoryUsage().heapUsed;
for (let index = 0; index < 10_000; index += 1) {
  cache.set(`key-${index}`, { index, payload: 'x'.repeat(128) });
}
global.gc?.();
const after = process.memoryUsage().heapUsed;
console.log(
  JSON.stringify({
    distinctKeysInserted: 10_000,
    retainedEntries: cache.size,
    maxEntries: 500,
    heapGrowthBytes: after - before,
    bounded: cache.size === 500,
  })
);
