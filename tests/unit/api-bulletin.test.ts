import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/bulletin/route';

describe('/api/bulletin Endpoint', () => {
  it('generates English WhatsApp bulletin', async () => {
    const req = new NextRequest('http://localhost:3000/api/bulletin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        lang: 'en',
        rwaName: 'Green Park RWA',
        city: 'New Delhi (Anand Vihar)',
        shortCity: 'New Delhi',
        wind: 6,
        pm25: 285,
        naqi: 412,
        bandLabel: 'Severe',
        cigsPerDay: 13,
        windowLabel: '1:00 PM – 3:30 PM',
        sealLabel: '4:30 PM',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bulletinText).toContain('Green Park RWA');
    expect(data.bulletinText).toContain('412 (Severe)');
    expect(data.bulletinText).toContain('1:00 PM – 3:30 PM');
    expect(data.bulletinText).toContain('Zero Biomass / Leaf Burning');
  });

  it('generates Hindi WhatsApp bulletin', async () => {
    const req = new NextRequest('http://localhost:3000/api/bulletin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        lang: 'hi',
        rwaName: 'रोहिणी सेक्टर 9 RWA',
        city: 'New Delhi',
        shortCity: 'Delhi',
        wind: 5,
        pm25: 250,
        naqi: 380,
        bandLabel: 'Very Poor',
        cigsPerDay: 11,
        windowLabel: '1:00 PM – 3:30 PM',
        sealLabel: '4:30 PM',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bulletinText).toContain('रोहिणी सेक्टर 9 RWA');
    expect(data.bulletinText).toContain('खुले में आग न जलाएँ');
  });
});
