import { NextRequest } from 'next/server';
import { handleAudit } from '@/server/api/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleAudit(req);
}
