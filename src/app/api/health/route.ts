import { NextResponse } from 'next/server';
import { securityJson } from '@/server/security/response';

export function GET() {
  return securityJson({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
