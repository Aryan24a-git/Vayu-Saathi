'use client';

import React from 'react';
import { Activity, Sparkles, Loader2 } from 'lucide-react';
import type { CalculatedImpact } from '@/domain/scenarios';
import type { PlaybookData } from '@/domain/playbookEngine';

interface ImpactMeterProps {
  playbook: PlaybookData;
  impact: CalculatedImpact;
  completedIds: string[];
  playbookSource: string;
  isGeneratingAI: boolean;
  onGenerateAI: () => void;
}

export function ImpactMeter({
  playbook,
  impact,
  completedIds,
  playbookSource,
  isGeneratingAI,
  onGenerateAI,
}: ImpactMeterProps) {
  const allItems = [...playbook.iaqHacks, ...playbook.emissionSwaps];
  const completed = allItems.filter((i) => completedIds.includes(i.id));

  const totalCount = allItems.length;
  const doneCount = completed.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const earnedExposure = Math.min(
    impact.maxExposureDropPct,
    completed.reduce((sum, item) => sum + (Number(item.exposurePct) || 0), 0)
  );
  const earnedCigs = Number(((impact.aqi.cigsPerDay * earnedExposure) / 100).toFixed(1));
  const earnedCo2 = Number(
    completed.reduce((sum, item) => sum + (Number(item.co2Kg) || 0), 0).toFixed(2)
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 text-teal-800">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-base text-slate-900">Today’s Live Impact Meter</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  playbookSource.includes('Gemini') || playbookSource.includes('AI')
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-stone-100 text-slate-600 border border-stone-200'
                }`}
              >
                {playbookSource}
              </span>
            </div>
            <span className="text-xs font-bold text-teal-800">
              {doneCount} / {totalCount} actions completed today
            </span>
          </div>

          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200/70">
            <div
              className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
            <div className="bg-stone-50 rounded-xl px-3 py-2 border border-stone-200/70">
              <div className="text-[11px] text-slate-600 font-medium">Exposure Cut</div>
              <div className="font-bold text-sm sm:text-base text-teal-800">
                <span>{earnedExposure}%</span>
                <span className="text-[11px] font-medium text-slate-600">
                  {' '}
                  / {impact.maxExposureDropPct}%
                </span>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl px-3 py-2 border border-stone-200/70">
              <div className="text-[11px] text-slate-600 font-medium">Cigs Avoided</div>
              <div className="font-bold text-sm sm:text-base text-emerald-700">
                <span>{earnedCigs.toFixed(1)}</span>
                <span className="text-[11px] font-medium text-slate-600"> today</span>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl px-3 py-2 border border-stone-200/70">
              <div className="text-[11px] text-slate-600 font-medium">CO₂ Saved</div>
              <div className="font-bold text-sm sm:text-base text-sky-700">
                <span>{earnedCo2.toFixed(2)}</span>
                <span className="text-[11px] font-medium text-slate-600"> kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-64 shrink-0 flex flex-col gap-2">
          <button
            type="button"
            disabled={isGeneratingAI}
            onClick={onGenerateAI}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isGeneratingAI ? 'Synthesizing...' : 'Generate Fresh AI Playbook'}</span>
          </button>
          <p className="text-[11px] text-slate-500 text-center leading-tight">
            Synthesizes AI guidance grounded in today’s exact CPCB NAQI &amp; household math.
          </p>
        </div>
      </div>
    </div>
  );
}
