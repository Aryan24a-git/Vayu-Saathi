import { NextRequest } from 'next/server';
import { handleAirQuality } from '@/server/api/airQuality';

export function GET(req: NextRequest) {
  return handleAirQuality(req);
}
