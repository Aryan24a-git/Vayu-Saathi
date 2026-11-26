import { NextRequest } from 'next/server';
import { handlePlaybook } from '@/server/api/playbook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handlePlaybook(req);
}
