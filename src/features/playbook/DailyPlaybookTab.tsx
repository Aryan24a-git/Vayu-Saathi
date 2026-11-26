'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { CalculatedImpact } from '@/domain/scenarios';
import type { PlaybookData } from '@/domain/playbookEngine';
import { ImpactMeter } from './ImpactMeter';
import { PlaybookChecklist } from './PlaybookChecklist';
import { ImpactExplainer } from './ImpactExplainer';

interface DailyPlaybookTabProps {
  playbook: PlaybookData;
  impact: CalculatedImpact;
  completedIds: string[];
  playbookSource: 'ai' | 'basic';
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
      {playbookSource === 'ai' && (
        <div
          role="region"
          aria-label="AI Tailored Plan Notice"
          className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white shadow-md border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  AI-Personalized Playbook Active
                </span>
                {playbook.generatedAt && (
                  <span className="text-[11px] text-teal-200/90 bg-teal-950/70 px-2 py-0.5 rounded-full border border-teal-700/60 font-medium">
                    Synthesized at {playbook.generatedAt}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-200 mt-1 leading-snug">
                {playbook.aiSummary ||
                  'Action items, timings, and sealing tips customized by Gemini AI for your household.'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-xl bg-teal-800/70 text-teal-200 text-xs font-semibold border border-teal-600/50 shrink-0">
            ✨ Gemini 3.0 Flash
          </span>
        </div>
      )}

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
