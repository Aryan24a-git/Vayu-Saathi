// Satisfies: OBS-001, EC-001
// Extracts or generates an x-request-id for end-to-end trace correlation.

import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function getRequestId(req: Request): string {
  const existing = req.headers.get(REQUEST_ID_HEADER);
  if (existing && existing.trim().length > 0) {
    return existing.trim();
  }
  return randomUUID();
}
