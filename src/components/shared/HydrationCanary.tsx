// Hydration canary: sets data-hydrated="true" on body after first client render.
// E2E tests await this attribute before interacting. Satisfies: TEST-004, REQ-003
'use client';

import { useEffect } from 'react';

export function HydrationCanary() {
  useEffect(() => {
    document.body.dataset.hydrated = 'true';
  }, []);
  return null;
}
