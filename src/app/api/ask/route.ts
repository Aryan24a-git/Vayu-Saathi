import { NextRequest } from 'next/server';
import { handleAsk } from '@/server/api/ask';

export function POST(req: NextRequest) {
  return handleAsk(req);
}
