import { NextRequest } from 'next/server';
import { handleGeocode } from '@/server/api/geocode';

export function GET(req: NextRequest) {
  return handleGeocode(req);
}
