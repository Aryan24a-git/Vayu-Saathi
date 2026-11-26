'use client';

import React, { useState, useEffect } from 'react';
import {
  Wind,
  SlidersHorizontal,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  HeartPulse,
  Navigation,
  IndianRupee,
  ChevronRight,
  Loader2,
  Zap,
  ZapOff,
} from 'lucide-react';
import type { HouseholdProfile, LocationScenario } from '@/domain/scenarios';
import { formatVulnList } from '@/domain/playbookEngine';

interface TopHeaderProps {
  activeLocation: LocationScenario | null;
  profile: HouseholdProfile;
  activeTab: 'playbook' | 'copilot' | 'community';
  onTabChange: (tab: 'playbook' | 'copilot' | 'community') => void;
  onOpenProfile: () => void;
  onFetchLiveCity: (city: string) => Promise<void>;
}

export function TopHeader({
  profile,
  activeTab,
  onTabChange,
  onOpenProfile,
  onFetchLiveCity,
}: TopHeaderProps) {
  const [cityInput, setCityInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [llmOn, setLlmOn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/ready')
      .then((r) => r.json())
      .then((d: { llm?: boolean }) => setLlmOn(d.llm ?? false))
      .catch(() => setLlmOn(false));
  }, []);

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setFetching(true);
    try {
      await onFetchLiveCity(cityInput.trim());
    } finally {
      setFetching(false);
    }
  };

  const purifierLabel =
    profile.purifier === 'none'
      ? 'No Purifier'
      : profile.purifier === 'one_room'
        ? '1 Room HEPA'
        : 'Whole Home HEPA';

  const budgetLabel =
    profile.budgetTier === 'zero_cost'
      ? '₹0 Hacks'
      : profile.budgetTier === 'diy_2000'
        ? 'DIY <₹2k'
        : 'Upgrades';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 leading-none">
                  VayuSaathi
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  CPCB NAQI + GenAI
                </span>
                {llmOn !== null && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      llmOn
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title={llmOn ? 'Gemini AI is active' : 'Running in basic rules mode'}
                  >
                    {llmOn ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                    {llmOn ? 'AI on' : 'Basic mode'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Protect indoors. Cut emissions outdoors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-3 pt-1 border-t border-stone-100">
          <form onSubmit={handleCitySubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Fetch live Indian city (e.g. Lucknow, Jaipur)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={fetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition shrink-0 disabled:opacity-50"
            >
              {fetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              <span>Fetch Live</span>
            </button>
          </form>

          <button
            onClick={onOpenProfile}
            type="button"
            title="Click to customize household profile"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-left py-0.5 group"
          >
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-900 border border-stone-200 group-hover:border-teal-200 whitespace-nowrap transition">
              <HeartPulse className="w-3 h-3 text-teal-700" />
              {formatVulnList(profile.vulnerabilities)}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-900 border border-stone-200 group-hover:border-teal-200 whitespace-nowrap transition">
              <Wind className="w-3 h-3 text-teal-700" />
              {purifierLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-900 border border-stone-200 group-hover:border-teal-200 whitespace-nowrap transition">
              <Navigation className="w-3 h-3 text-teal-700" />
              {profile.commuteMode === 'wfh' ? 'WFH' : `${profile.commuteKm} km`}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-900 border border-stone-200 group-hover:border-teal-200 whitespace-nowrap transition">
              <IndianRupee className="w-3 h-3 text-teal-700" />
              {budgetLabel}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-teal-700 ml-1 whitespace-nowrap">
              Edit <ChevronRight className="w-3 h-3" />
            </span>
          </button>
        </div>

        <nav
          className="hidden md:flex items-center gap-1 -mb-px"
          role="tablist"
          aria-label="Primary Tabs"
        >
          <button
            onClick={() => onTabChange('playbook')}
            aria-selected={activeTab === 'playbook'}
            role="tab"
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'playbook'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-stone-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Daily Playbook</span>
          </button>
          <button
            onClick={() => onTabChange('copilot')}
            aria-selected={activeTab === 'copilot'}
            role="tab"
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'copilot'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-stone-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
          <button
            onClick={() => onTabChange('community')}
            aria-selected={activeTab === 'community'}
            role="tab"
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'community'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-stone-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Community &amp; RWA Hub</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
