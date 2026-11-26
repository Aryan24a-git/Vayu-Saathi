import { buildBasicPlan } from '../src/domain/plan';
import { createDefaultProfile, type Profile } from '../src/domain/profile';
import type { AirQualitySnapshot } from '../src/domain/types';

const profile: Profile = createDefaultProfile();
const snapshot: AirQualitySnapshot = {
  aqi: 175,
  pm25: 72,
  timestamp: '2026-11-22T12:00:00Z',
  provider: 'benchmark',
  isStale: false,
  isFallback: false,
};
const now = new Date('2026-11-22T12:00:00Z');
const durations: number[] = [];

for (let index = 0; index < 2000; index += 1) {
  const start = performance.now();
  buildBasicPlan(profile, snapshot, now);
  durations.push(performance.now() - start);
}

durations.sort((left, right) => left - right);
const p95 = durations[Math.floor(durations.length * 0.95 - 1)] ?? 0;
console.log(
  JSON.stringify({
    iterations: durations.length,
    p95Ms: Number(p95.toFixed(3)),
    thresholdMs: 300,
    pass: p95 < 300,
  })
);
