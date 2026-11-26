import React from 'react';
import type { NormalizedPlanItem } from './usePlan';
import { ActionCard } from './ActionCard';

export function AlternativesTab({
  items,
  onAsk,
}: {
  items: readonly NormalizedPlanItem[];
  onAsk?: (question: string) => void;
}) {
  if (!items.length) {
    return (
      <p className="rounded-lg border p-4 text-sm">
        No additional alternatives are required for this profile.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.action.id}>
          <ActionCard item={item} onAskAboutAction={onAsk} />
          <p className="mt-1 px-2 text-xs text-slate-600">
            Feasibility: {item.action.feasibilityNote}
          </p>
        </div>
      ))}
    </div>
  );
}
