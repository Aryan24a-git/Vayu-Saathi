'use client';

import React from 'react';
import type { CalculatedImpact } from '@/domain/scenarios';
import type { PlaybookData } from '@/domain/playbookEngine';
import { ImpactMeter } from './ImpactMeter';
import { PlaybookChecklist } from './PlaybookChecklist';
import { ImpactExplainer } from './ImpactExplainer';

interface DailyPlaybookTabProps {
  playbook: PlaybookData;
  impact: CalculatedImpact;
  completedIds: string[];
  playbookSource: string;
  isGeneratingAI: boolean;
  onTogglePledge: (id: string) => void;
  onGenerateAI: () => void;
}

export function DailyPlaybookTab({
  playbook,
  impact,
  completedIds,
  playbookSource,
  isGeneratingAI,
  onTogglePledge,
  onGenerateAI,
}: DailyPlaybookTabProps) {
  return (
    <section className="space-y-5" aria-label="Daily Smog Playbook">
      <ImpactMeter
        playbook={playbook}
        impact={impact}
        completedIds={completedIds}
        playbookSource={playbookSource}
        isGeneratingAI={isGeneratingAI}
        onGenerateAI={onGenerateAI}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <PlaybookChecklist
          iaqHacks={playbook.iaqHacks}
          emissionSwaps={playbook.emissionSwaps}
          completedIds={completedIds}
          onToggle={onTogglePledge}
        />
        <ImpactExplainer playbook={playbook} impact={impact} />
      </div>
    </section>
  );
}
