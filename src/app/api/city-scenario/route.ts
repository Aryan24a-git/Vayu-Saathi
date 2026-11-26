import { NextRequest } from 'next/server';
import { handleCityScenario } from '@/server/api/cityScenario';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleCityScenario(req);
}
