import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/audit/route';
import { verifyImageMagicBytes } from '../../src/server/api/audit';

describe('Image Magic Bytes Validation (SEC-011)', () => {
  it('validates authentic JPEG header', () => {
    // FF D8 FF E0 00 10 4A 46 49 46
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const b64 = Buffer.from(jpegBytes).toString('base64');
    expect(verifyImageMagicBytes(b64)).toBe(true);
    expect(verifyImageMagicBytes(`data:image/jpeg;base64,${b64}`)).toBe(true);
  });

  it('validates authentic PNG header', () => {
    // 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const b64 = Buffer.from(pngBytes).toString('base64');
    expect(verifyImageMagicBytes(b64)).toBe(true);
    expect(verifyImageMagicBytes(`data:image/png;base64,${b64}`)).toBe(true);
  });

  it('validates authentic WebP header', () => {
    // 52 49 46 46 xx xx xx xx 57 45 42 50
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const b64 = Buffer.from(webpBytes).toString('base64');
    expect(verifyImageMagicBytes(b64)).toBe(true);
    expect(verifyImageMagicBytes(`data:image/webp;base64,${b64}`)).toBe(true);
  });

  it('rejects plain text or html disguised as image', () => {
    const textBytes = Buffer.from('<script>alert("hack")</script>').toString('base64');
    expect(verifyImageMagicBytes(textBytes)).toBe(false);
  });

  it('rejects truncated or empty data', () => {
    expect(verifyImageMagicBytes('')).toBe(false);
    expect(verifyImageMagicBytes('xyz')).toBe(false);
  });
});

describe('/api/audit Endpoint', () => {
  it('evaluates window gap with zero-cost recommendations', async () => {
    const req = new NextRequest('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        focusArea: 'Window or Door Gap',
        city: 'New Delhi',
        naqi: 412,
        pm25: 285,
        budgetTier: 'zero_cost',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.immediateFix).toContain('damp cotton towel');
    expect(data.impactWhy).toContain('sleeping zone');
  });

  it('evaluates kitchen setup with exhaust advice', async () => {
    const req = new NextRequest('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        focusArea: 'Kitchen & Exhaust Setup',
        city: 'Patna',
        naqi: 340,
        pm25: 195,
        budgetTier: 'diy_2000',
        kitchenExhaust: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.immediateFix).toContain('exhaust 2 minutes before cooking');
  });

  it('evaluates valid base64 image payload', async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const b64 = `data:image/jpeg;base64,${Buffer.from(jpegBytes).toString('base64')}`;

    const req = new NextRequest('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        focusArea: 'N95 / Mask Seal Fit',
        city: 'New Delhi',
        naqi: 450,
        pm25: 320,
        budgetTier: 'zero_cost',
        imageBase64: b64,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.observations).toBeDefined();
  });

  it('rejects malformed body with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ focusArea: 'x' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
