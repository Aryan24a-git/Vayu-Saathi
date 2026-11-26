import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/playbook/route';
import { SCENARIOS, DEFAULT_PROFILE, computeDeterministicImpact } from '../../src/domain/scenarios';
import { findSafeVentilationWindow } from '../../src/domain/naqi';

describe('/api/playbook Endpoint', () => {
  it('returns status 200 and structured playbook', async () => {
    const loc = SCENARIOS.delhi;
    const vent = findSafeVentilationWindow(loc.hourlyPM25, loc.hourlyWind);
    const impact = computeDeterministicImpact(loc, DEFAULT_PROFILE);

    const req = new NextRequest('http://localhost:3000/api/playbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: loc, profile: DEFAULT_PROFILE, vent, impact }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.playbook).toBeDefined();
    expect(data.playbook.iaqHacks).toHaveLength(3);
    expect(data.playbook.emissionSwaps).toHaveLength(3);
    expect(data.source).toBe('Grounded VayuSaathi AI Engine');
  });

  it('rejects invalid payload with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/playbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ invalid: 'body' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
