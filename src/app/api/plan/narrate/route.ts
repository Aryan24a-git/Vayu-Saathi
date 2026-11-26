import { NextRequest } from 'next/server';
import { handlePlanNarrate } from '@/server/api/narrate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handlePlanNarrate(req);
}
