import { NextResponse } from 'next/server';
import type { ApiError } from '../../domain/types';
import { withSecurityHeaders } from './headers';

export function securityJson(body: unknown, status = 200, headers?: HeadersInit): NextResponse {
  const response = NextResponse.json(body, { status, headers });
  if (headers) {
    for (const [key, value] of new Headers(headers).entries()) response.headers.set(key, value);
  }
  return withSecurityHeaders(response);
}

export function apiErrorResponse(
  error: ApiError,
  status: number,
  headers?: HeadersInit
): NextResponse {
  return securityJson(error, status, headers);
}
