const baseUrl = process.env['BENCH_URL'] ?? 'http://localhost:3000';
const body = JSON.stringify({
  profile: {
    schemaVersion: 1,
    members: [{ ageBand: 'adult', vulnerabilityFlags: [] }],
    housingType: 'average',
    hasPurifier: false,
    cookingFuel: 'lpg',
    heatingType: 'none',
    commuteTypes: ['bus'],
    budgetBand: 'low',
  },
  aqi: 175,
  pm25: 72,
  mode: 'basic',
});
const durations: number[] = [];
async function main(): Promise<void> {
  for (let index = 0; index < 100; index += 1) {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `198.51.100.${(index % 250) + 1}`,
      },
      body,
    });
    await response.arrayBuffer();
    durations.push(performance.now() - start);
    if (!response.ok) throw new Error(`Benchmark request failed: ${response.status}`);
  }
  durations.sort((left, right) => left - right);
  const p50 = durations[Math.floor(durations.length * 0.5 - 1)] ?? 0;
  const p95 = durations[Math.floor(durations.length * 0.95 - 1)] ?? 0;
  console.log(
    JSON.stringify({
      iterations: 100,
      p50Ms: Number(p50.toFixed(3)),
      p95Ms: Number(p95.toFixed(3)),
      thresholdMs: 300,
      pass: p95 < 300,
    })
  );
}

void main();
