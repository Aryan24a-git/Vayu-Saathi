import { NextRequest } from 'next/server';
import { handleBulletin } from '@/server/api/bulletin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleBulletin(req);
}
