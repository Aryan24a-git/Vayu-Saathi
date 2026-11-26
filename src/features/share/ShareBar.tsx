'use client';

import React, { useState } from 'react';
import type { NormalizedPlan } from '../plan/usePlan';
import type { AqiReading } from '@/lib/providers/aqi';
import { planToText } from './planToText';

export function ShareBar({ plan, reading }: { plan: NormalizedPlan; reading: AqiReading }) {
  const [status, setStatus] = useState('');
  const copyText = async () => {
    const text = planToText(plan, reading);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setStatus('Copied');
    } catch {
      setStatus('Copy unavailable');
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <button type="button" onClick={copyText} className="min-h-11 rounded border px-3 text-sm">
        Copy plan
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="min-h-11 rounded border px-3 text-sm"
      >
        Print
      </button>
      <span role="status" aria-live="polite" className="text-sm">
        {status}
      </span>
    </div>
  );
}
