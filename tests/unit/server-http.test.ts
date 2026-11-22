// Satisfies: TEST-001, SEC-001, OBS-001, EC-001
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { getRequestId, REQUEST_ID_HEADER } from '../../src/server/http/requestId';
import { createApiError, ErrorCode } from '../../src/server/http/errors';
import { validateJsonBody } from '../../src/server/http/validate';

describe('Server HTTP Utilities', () => {
  it('extracts or generates request ID cleanly', () => {
    const reqWithId = new Request('http://localhost:3000/api/plan', {
      headers: { [REQUEST_ID_HEADER]: 'req-abc-123' },
    });
    expect(getRequestId(reqWithId)).toBe('req-abc-123');

    const reqWithoutId = new Request('http://localhost:3000/api/plan');
    const generated = getRequestId(reqWithoutId);
    expect(generated).toBeDefined();
    expect(generated.length).toBeGreaterThan(10);
  });

  it('creates standardized API error formats', () => {
    const err = createApiError(ErrorCode.NOT_FOUND, 'Resource was not found', 'req-999', {
      id: '123',
    });
    expect(err.code).toBe(ErrorCode.NOT_FOUND);
    expect(err.message).toBe('Resource was not found');
    expect(err.requestId).toBe('req-999');
    expect(err.details).toEqual({ id: '123' });
    expect(err.timestamp).toBeDefined();
  });

  it('validates JSON body with Result types', async () => {
    const TestSchema = z.object({ aqi: z.number().min(0) });

    const validReq = new Request('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ aqi: 150 }),
    });
    const validRes = await validateJsonBody(validReq, TestSchema, 'req-1');
    expect(validRes.ok).toBe(true);
    if (validRes.ok) {
      expect(validRes.value.aqi).toBe(150);
    }

    const invalidReq = new Request('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ aqi: -10 }),
    });
    const invalidRes = await validateJsonBody(invalidReq, TestSchema, 'req-2');
    expect(invalidRes.ok).toBe(false);
    if (!invalidRes.ok) {
      expect(invalidRes.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });
});
