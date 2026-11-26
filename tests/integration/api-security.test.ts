import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { NextRequest } from 'next/server';
import { GET as airQualityGet } from '../../src/app/api/air-quality/route';
import { GET as geocodeGet } from '../../src/app/api/geocode/route';
import { POST as planPost } from '../../src/app/api/plan/route';
import { POST as askPost } from '../../src/app/api/ask/route';
import { GET as healthGet } from '../../src/app/api/health/route';
import { GET as readyGet } from '../../src/app/api/ready/route';
import { openMeteoHandlers } from './msw/handlers';
import { createDefaultProfile } from '../../src/domain/profile';
import { clearAirQualityCaches } from '../../src/server/providers/openMeteoAirQuality';
import { getHashedClientKey } from '../../src/server/security/rateLimit';
import { RATE_LIMITS } from '../../src/server/security/limits';

const server = setupServer(...openMeteoHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]): NextRequest {
  return new NextRequest(url, init);
}

describe('API boundary security', () => {
  it('returns success and security headers', async () => {
    const response = await airQualityGet(
      request('http://localhost/api/air-quality?lat=52.52&lon=13.41', {
        headers: { 'x-forwarded-for': '203.0.113.10' },
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-security-policy')).toContain("script-src 'self'");
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('validates geocoding queries and returns 400', async () => {
    const response = await geocodeGet(
      request('http://localhost/api/geocode?q=x', {
        headers: { 'x-forwarded-for': '203.0.113.11' },
      })
    );
    expect(response.status).toBe(400);
  });

  it('rejects malformed JSON with the single error format', async () => {
    const response = await planPost(
      request('http://localhost/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.17' },
        body: '{not-json',
      })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('BAD_REQUEST');
  });

  it('rejects unsupported content type and oversized plan bodies', async () => {
    const unsupported = await planPost(
      request('http://localhost/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'text/plain', 'x-forwarded-for': '203.0.113.12' },
        body: '{}',
      })
    );
    expect(unsupported.status).toBe(415);

    const oversized = await planPost(
      request('http://localhost/api/plan', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': '17000',
          'x-forwarded-for': '203.0.113.13',
        },
        body: '{}',
      })
    );
    expect(oversized.status).toBe(413);
  });

  it('produces basic plans and never exposes LLM failure details', async () => {
    const body = JSON.stringify({
      profile: createDefaultProfile(),
      aqi: 175,
      pm25: 72,
      mode: 'basic',
    });
    const response = await planPost(
      request('http://localhost/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.14' },
        body,
      })
    );
    expect(response.status).toBe(200);
    expect((await response.json()).isFallback).toBe(true);
  });

  it('returns 429 with Retry-After for ask requests', async () => {
    const headers = { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.15' };
    let response: Response = new Response();
    for (let index = 0; index < RATE_LIMITS.askPerMinute + 1; index += 1) {
      response = await askPost(
        request('http://localhost/api/ask', {
          method: 'POST',
          headers,
          body: JSON.stringify({ question: 'How should I ventilate indoors?' }),
        })
      );
    }
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).not.toBeNull();
  });

  it('maps malformed upstream JSON to provider unavailable', async () => {
    clearAirQualityCaches();
    server.use(
      http.get('https://air-quality-api.open-meteo.com/v1/air-quality', () =>
        HttpResponse.json({ unexpected: true }, { status: 200 })
      )
    );
    const response = await airQualityGet(
      request('http://localhost/api/air-quality?lat=52.52&lon=13.41', {
        headers: { 'x-forwarded-for': '203.0.113.16' },
      })
    );
    expect(response.status).toBe(503);
  });

  it('maps repeated upstream 500 responses to provider unavailable', async () => {
    clearAirQualityCaches();
    server.use(
      http.get('https://air-quality-api.open-meteo.com/v1/air-quality', () =>
        HttpResponse.text('upstream secret', { status: 500 })
      )
    );
    const response = await airQualityGet(
      request('http://localhost/api/air-quality?lat=53&lon=14', {
        headers: { 'x-forwarded-for': '203.0.113.18' },
      })
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('upstream secret');
  });

  it('hashes the trusted client IP and never logs or returns it', async () => {
    const req = request('http://localhost/api/health', {
      headers: { 'x-forwarded-for': '203.0.113.99' },
    });
    const key = getHashedClientKey(req);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain('203.0.113.99');
  });

  it('returns health and config-only readiness', async () => {
    expect(healthGet().status).toBe(200);
    expect(readyGet(request('http://localhost/api/ready')).status).toBe(200);
  });
});
