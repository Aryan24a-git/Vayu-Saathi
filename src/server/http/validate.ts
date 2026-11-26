// Satisfies: SEC-001, EC-001, EC-003
// Generic request body and query validator producing typed Results with ApiError.

import { z } from 'zod';
import { ok, err, type Result } from '../../domain/result';
import type { ApiError } from '../../domain/types';
import { createApiError, ErrorCode } from './errors';

export async function validateJsonBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
  requestId: string
): Promise<Result<T, ApiError>> {
  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return err(createApiError(ErrorCode.BAD_REQUEST, 'Malformed JSON body', requestId));
  }

  const parseResult = schema.safeParse(rawJson);
  if (!parseResult.success) {
    return err(
      createApiError(
        ErrorCode.VALIDATION_ERROR,
        'Request validation failed',
        requestId,
        parseResult.error.issues
      )
    );
  }

  return ok(parseResult.data);
}
