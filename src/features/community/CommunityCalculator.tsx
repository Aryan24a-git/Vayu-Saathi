'use client';

import React, { useState } from 'react';
import catalogData from '@/catalog/catalog.json';
import type { Action } from '@/catalog/catalog.schema';
import { calculateCommunityImpact } from '@/domain/impact-model';
import { communityEstimateText } from './communityText';

const actions = (catalogData.actions as readonly Action[]).filter(
  (action) => action.impact.benefitType === 'emissions' || action.impact.benefitType === 'both'
);

export function CommunityCalculator() {
  const [households, setHouseholds] = useState(100);
  const [actionId, setActionId] = useState(actions[0]?.id ?? 'ACT-015');
  const action = actions.find((item) => item.id === actionId) ?? actions[0];
  const result = action ? calculateCommunityImpact(action.impact, households) : null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-bold">Community what-if calculator</h2>
      <label htmlFor="community-action" className="mt-3 block text-sm">
        Action
      </label>
      <select
        id="community-action"
        value={actionId}
        onChange={(event) => setActionId(event.target.value)}
        className="mt-1 min-h-11 w-full rounded border p-2"
      >
        {actions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <label htmlFor="community-households" className="mt-3 block text-sm">
        Households (1–10000)
      </label>
      <input
        id="community-households"
        type="number"
        min="1"
        max="10000"
        value={households}
        onChange={(event) =>
          setHouseholds(Math.min(10000, Math.max(1, Number(event.target.value))))
        }
        className="mt-1 min-h-11 w-40 rounded border px-3"
      />
      {action && result && (
        <div className="mt-3 text-sm">
          <p>
            <strong>Estimate:</strong>{' '}
            {communityEstimateText(
              households,
              result.projectedRangeLow,
              result.projectedRangeHigh,
              result.unit
            )}
          </p>
          <p className="mt-1 text-slate-600">
            Basis: {action.impact.basis} · Confidence: {action.impact.confidence}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Assumptions: 20–40% adoption. Individual results will vary.
          </p>
        </div>
      )}
    </section>
  );
}
