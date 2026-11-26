'use client';

import React, { useState } from 'react';
import type { Profile } from '@/domain/profile';
import type { NormalizedPlanItem } from './usePlan';
import { ActionCard } from './ActionCard';
import { CostFilter } from './CostFilter';

export function IndoorsTab({
  items,
  profile,
  onAsk,
}: {
  items: readonly NormalizedPlanItem[];
  profile: Profile;
  onAsk?: (question: string) => void;
}) {
  const [showPaid, setShowPaid] = useState(profile.budgetBand !== 'none');
  const visible = showPaid
    ? [...items].sort((a, b) => costRank(a.action.budgetTier) - costRank(b.action.budgetTier))
    : items.filter((item) => item.action.budgetTier === 'free');
  return (
    <div className="space-y-3">
      <CostFilter showPaid={showPaid} onChange={setShowPaid} />
      {visible.length ? (
        visible.map((item) => (
          <ActionCard key={item.action.id} item={item} onAskAboutAction={onAsk} />
        ))
      ) : (
        <p className="rounded-lg border p-4 text-sm">
          Your home already has these covered. No free indoor actions are needed.
        </p>
      )}
    </div>
  );
}

function costRank(tier: string): number {
  return { free: 0, low: 1, medium: 2, high: 3 }[tier] ?? 4;
}
