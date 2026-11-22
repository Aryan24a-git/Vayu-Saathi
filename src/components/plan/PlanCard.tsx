// Satisfies: REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-012, D4, D5
'use client';

import React, { useState } from 'react';
import { AlertCircle, Clock, ShieldCheck, Share2, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import type { GeneratedPlan } from '@/lib/ai/planner';
import type { Action } from '@/catalog/catalog.schema';

interface PlanCardProps {
  plan: GeneratedPlan;
}

function ActionItem({ action }: { action: Action }) {
  const [open, setOpen] = useState(false);
  const imp = action.impact;

  return (
    <article className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {action.timeOfDay} · {action.category}
          </span>
          <h4 className="text-sm font-semibold text-slate-900 mt-1">{action.title}</h4>
          <p className="text-xs text-slate-600 mt-0.5">{action.description}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-expanded={open}
          aria-label="Toggle impact details"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="pt-2 border-t border-slate-100 text-xs bg-slate-50 -mx-3 -mb-3 p-3 rounded-b-lg space-y-1">
          <p className="font-semibold text-slate-800">
            Impact: {imp.magnitudeRange.low}–{imp.magnitudeRange.high} {imp.magnitudeRange.unit} ({imp.benefitType.replace('_', ' ')})
          </p>
          <p className="text-slate-600">{imp.magnitudeDescription}</p>
          <p className="text-[11px] text-slate-500 italic">Basis: {imp.basis}</p>
          <p className="text-[10px] text-slate-400">Source: {imp.sourceNote} · Confidence: {imp.confidence}</p>
        </div>
      )}
    </article>
  );
}

export function PlanCard({ plan }: PlanCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `Clear Air Plan (${plan.effectiveBandLabel}):\n` +
      plan.actions.map((a, i) => `${i + 1}. ${a.title}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  return (
    <section aria-labelledby="plan-heading" className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 id="plan-heading" className="text-lg font-bold text-slate-900">Your Action Plan</h2>
            <p className="text-xs text-slate-500">{plan.effectiveBandLabel} Protection Plan</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600" /> {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" /> Print
            </button>
          </div>
        </div>

        {plan.hasRedFlag && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-red-900 uppercase">Emergency Health Warning</h3>
              <p className="text-xs text-red-700 mt-0.5">
                Severe pollution level detected. If any member develops chest pain or acute breathlessness, seek immediate emergency medical care.
              </p>
            </div>
          </div>
        )}

        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-medium">{plan.narrative}</p>
        </div>

        <div className="space-y-2.5">
          {plan.actions.map((act) => (
            <ActionItem key={act.id} action={act} />
          ))}
        </div>

        <footer className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          {plan.medicalDisclaimer}
        </footer>
      </div>
    </section>
  );
}
