import { NextRequest } from 'next/server';
import { getEnv } from '@/server/config/env';
import { getRequestId } from '@/server/http/requestId';
import { apiErrorResponse, securityJson } from '@/server/security/response';

export function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    getEnv();
    const llm = !!process.env['GEMINI_API_KEY'];
    return securityJson({ status: 'ready', timestamp: new Date().toISOString(), llm }, 200);
  } catch {
    return apiErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: 'Service configuration is unavailable',
        requestId,
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
}
