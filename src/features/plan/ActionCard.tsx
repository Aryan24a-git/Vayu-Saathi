'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { NormalizedPlanItem } from './usePlan';

export interface ActionCardProps {
  item: NormalizedPlanItem;
  onAskAboutAction?: (question: string) => void;
}

export function ActionCard({ item, onAskAboutAction }: ActionCardProps) {
  const [open, setOpen] = useState(false);
  const impact = item.action.impact;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{item.action.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.action.shortDescription}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-1">
              {item.action.budgetTier} cost
            </span>
            {item.optional && (
              <span className="rounded-full bg-amber-100 px-2 py-1">Optional paid option</span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="min-h-11 min-w-11 rounded border border-slate-200 p-2"
          aria-expanded={open}
          aria-controls={`impact-${item.action.id}`}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          <span className="sr-only">Toggle impact details</span>
        </button>
      </div>
      {open && (
        <div id={`impact-${item.action.id}`} className="mt-3 space-y-1 border-t pt-3 text-sm">
          <p>
            <strong>What changes:</strong> {impact.magnitudeDescription}
          </p>
          <p>
            <strong>How much:</strong> {item.explanationRange}
          </p>
          <p>
            <strong>Why we think so:</strong> {impact.basis}
          </p>
          <p>
            <strong>How sure we are:</strong> {impact.confidence} confidence
          </p>
        </div>
      )}
      {onAskAboutAction && (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-blue-700 underline"
          onClick={() => onAskAboutAction(`How can I use ${item.action.title}?`)}
        >
          Ask about this
        </button>
      )}
    </article>
  );
}
