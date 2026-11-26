'use client';

import React, { useState } from 'react';
import type { NormalizedPlan } from './usePlan';
import type { Profile } from '@/domain/profile';
import { TodayTab } from './TodayTab';
import { IndoorsTab } from './IndoorsTab';
import { AlternativesTab } from './AlternativesTab';
import { WhyItMattersTab } from './WhyItMattersTab';

export type PlanTab = 'today' | 'indoors' | 'alternatives' | 'why';

export function PlanTabs({
  plan,
  profile,
  onAsk,
}: {
  plan: NormalizedPlan;
  profile: Profile;
  onAsk?: (question: string) => void;
}) {
  const [tab, setTab] = useState<PlanTab>('today');
  const tabs: readonly { id: PlanTab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'indoors', label: 'Indoors' },
    { id: 'alternatives', label: 'Alternatives' },
    { id: 'why', label: 'Why it matters' },
  ];
  return (
    <section>
      <div role="tablist" aria-label="Plan sections" className="flex flex-wrap gap-2 border-b">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={`min-h-11 px-3 text-sm ${tab === entry.id ? 'border-b-2 border-blue-700 font-bold' : ''}`}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {tab === 'today' && <TodayTab plan={plan} onAsk={onAsk} />}
        {tab === 'indoors' && <IndoorsTab items={plan.indoors} profile={profile} onAsk={onAsk} />}
        {tab === 'alternatives' && <AlternativesTab items={plan.alternatives} onAsk={onAsk} />}
        {tab === 'why' && <WhyItMattersTab plan={plan} />}
      </div>
    </section>
  );
}
