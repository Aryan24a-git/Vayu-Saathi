// Satisfies: TEST-002, REL-003
import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/health/route';

describe('Health Route Endpoint', () => {
  it('returns status ok and version', async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.version).toBe('1.0.0');
    expect(data.timestamp).toBeDefined();
  });
});
