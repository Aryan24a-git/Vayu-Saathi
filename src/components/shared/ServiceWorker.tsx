// Satisfies: REQ-010 — registers SW only in production; accepts nonce prop
// for the layout to pass through. Cleans up stale workers on mount.
'use client';

import { useEffect } from 'react';

interface ServiceWorkerProps {
  nonce?: string;
}

export function ServiceWorker({ nonce: _nonce }: ServiceWorkerProps) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister());
      });
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
      }
      return;
    }

    // Unregister any worker using an old cache name before registering new one
    navigator.serviceWorker.getRegistrations().then((regs) => {
      const stale = regs.filter((r) => r.active?.scriptURL.includes('/sw.js'));
      Promise.all(stale.map((r) => r.unregister())).then(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      });
    });
  }, []);
  return null;
}
