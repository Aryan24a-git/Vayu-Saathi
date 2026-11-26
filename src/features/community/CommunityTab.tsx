'use client';

import React from 'react';
import { Globe2 } from 'lucide-react';
import type { LocationScenario, HouseholdProfile, CalculatedImpact } from '@/domain/scenarios';
import type { VentilationWindow } from '@/domain/naqi';
import { WhatsAppGenerator } from './WhatsAppGenerator';
import { ColonySimulator } from './ColonySimulator';
import { SmogPinboard, type HotspotReport } from './SmogPinboard';

interface CommunityTabProps {
  location: LocationScenario;
  profile: HouseholdProfile;
  vent: VentilationWindow | null;
  impact: CalculatedImpact;
  completedPledgesCount: number;
  userCo2Kg: number;
  hotspots: HotspotReport[];
  upvotedIds: string[];
  onAddHotspot: (report: HotspotReport) => void;
  onToggleUpvote: (id: string) => void;
  onRemoveHotspot: (id: string) => void;
}

export function CommunityTab({
  location,
  profile,
  vent,
  impact,
  completedPledgesCount,
  userCo2Kg,
  hotspots,
  upvotedIds,
  onAddHotspot,
  onToggleUpvote,
  onRemoveHotspot,
}: CommunityTabProps) {
  const totalPledges = completedPledgesCount;
  const totalCo2 = Number(userCo2Kg.toFixed(2));

  return (
    <section aria-label="Community &amp; RWA Action Hub" className="space-y-5">
      {/* Device-Local Action Tracker Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            <Globe2 className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                Your actions on this device
              </span>
              {location.isSynthetic && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-300 text-amber-950">
                  Sample data
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg sm:text-xl leading-snug">
              {location.shortCity} Action &amp; RWA Hub
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Every checklist item you complete in Daily Playbook updates this local device counter.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 text-center">
            <div className="font-extrabold text-2xl text-emerald-300">
              {totalPledges.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-200">Household Pledges</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 text-center">
            <div className="font-extrabold text-2xl text-sky-300">
              {totalCo2.toLocaleString('en-IN')} kg
            </div>
            <div className="text-[11px] text-slate-200">CO₂ Avoided Today</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <WhatsAppGenerator location={location} vent={vent} impact={impact} />
        </div>
        <div className="lg:col-span-6">
          <ColonySimulator profile={profile} />
        </div>
      </div>

      <SmogPinboard
        location={location}
        hotspots={hotspots}
        upvotedIds={upvotedIds}
        onAddHotspot={onAddHotspot}
        onToggleUpvote={onToggleUpvote}
        onRemoveHotspot={onRemoveHotspot}
      />
    </section>
  );
}
