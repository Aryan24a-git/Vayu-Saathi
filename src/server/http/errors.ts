// Satisfies: SEC-001, OBS-001, EC-001
// Standardized API error responses according to ARCHITECTURE 4.5.

import type { ApiError } from '../../domain/types';

export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export function createApiError(
  code: ErrorCodeType,
  message: string,
  requestId: string,
  details?: unknown
): ApiError {
  return {
    code,
    message,
    requestId,
    details,
    timestamp: new Date().toISOString(),
  };
}
