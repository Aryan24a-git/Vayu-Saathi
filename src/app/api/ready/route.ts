import { NextRequest } from 'next/server';
import { checkLlmReadiness } from '@/server/llm/client';
import { getRequestId } from '@/server/http/requestId';
import { apiErrorResponse, securityJson } from '@/server/security/response';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const llm = await checkLlmReadiness();
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
