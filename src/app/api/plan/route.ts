import { NextRequest } from 'next/server';
import { handlePlan } from '@/server/api/plan';

export function POST(req: NextRequest) {
  return handlePlan(req);
}
