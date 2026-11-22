// Satisfies: REQ-016, D4
'use client';

import React, { useState } from 'react';
import { Users2, Sparkles } from 'lucide-react';
import { calculateWhatIf, validateHouseholdCount } from '@/domain/community-calc';
import catalogData from '@/catalog/catalog.json';
import type { Action } from '@/catalog/catalog.schema';

const actions = (catalogData.actions as Action[]).filter(
  (a) => a.impact.benefitType === 'both' || a.impact.benefitType === 'emissions'
);

export function CommunityCalculator() {
  const [selectedId, setSelectedId] = useState<string>(actions[0]?.id ?? 'ACT-015');
  const [households, setHouseholds] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  const selectedAction = actions.find((a) => a.id === selectedId) ?? actions[0]!;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateHouseholdCount(households);
    setError(err);
  };

  const result = !error
    ? calculateWhatIf({
        householdCount: households,
        actionId: selectedAction.id,
        impact: selectedAction.impact,
      })
    : null;

  return (
    <section
      aria-labelledby="community-calc-heading"
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Users2 className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        <div>
          <h2 id="community-calc-heading" className="text-base font-bold text-slate-900">
            Community &quot;What-If&quot; Calculator
          </h2>
          <p className="text-xs text-slate-500">
            Model the collective effect if your apartment block or colony acts together.
          </p>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="action-select"
            className="block text-xs font-semibold text-slate-600 mb-1"
          >
            Community Action
          </label>
          <select
            id="action-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
          >
            {actions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="household-input"
            className="block text-xs font-semibold text-slate-600 mb-1"
          >
            Number of Households
          </label>
          <input
            id="household-input"
            type="number"
            min="1"
            max="100000"
            value={households}
            onChange={(e) => {
              const val = Number(e.target.value) || 1;
              setHouseholds(val);
              setError(validateHouseholdCount(val));
            }}
            className="w-full text-xs p-2 rounded border border-slate-300"
          />
        </div>
      </form>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Projected Community Impact
          </div>
          <p className="text-xs text-indigo-950">{result.narrative}</p>
          <div className="flex gap-4 pt-1 text-xs">
            <div>
              <span className="text-[10px] uppercase text-indigo-700 block">Active Households</span>
              <strong>
                {result.estimatedParticipants.low} - {result.estimatedParticipants.high}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-indigo-700 block">
                Total Benefit Range
              </span>
              <strong>
                {result.projectedEffect.low} - {result.projectedEffect.high}{' '}
                {result.projectedEffect.unit}
              </strong>
            </div>
          </div>
          <p className="text-[10px] text-indigo-700/80 italic pt-1">{result.caveat}</p>
        </div>
      )}
    </section>
  );
}
