import { NextRequest } from 'next/server';
import { getEnv } from '@/server/config/env';
import { isLlmModelUnavailable } from '@/server/llm/client';
import { getRequestId } from '@/server/http/requestId';
import { apiErrorResponse, securityJson } from '@/server/security/response';

export function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const env = getEnv();
    const llm = Boolean(env.LLM_ENABLED && env.GEMINI_API_KEY && !isLlmModelUnavailable());
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
