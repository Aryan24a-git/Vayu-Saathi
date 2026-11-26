import React from 'react';
import type {
  HouseholdProfile,
  Vulnerability,
  CommuteMode,
  PurifierSetup,
  BudgetTier,
} from '@/domain/scenarios';
import {
  VULNERABILITY_OPTIONS,
  PURIFIER_OPTIONS,
  COMMUTE_OPTIONS,
  BUDGET_OPTIONS,
} from './profileOptions';

interface SectionProps {
  draft: HouseholdProfile;
  setDraft: React.Dispatch<React.SetStateAction<HouseholdProfile>>;
}

export function VulnerabilitySection({ draft, setDraft }: SectionProps) {
  const toggleVuln = (v: Vulnerability) => {
    if (v === 'none') {
      setDraft((p) => ({ ...p, vulnerabilities: ['none'] }));
      return;
    }
    const current = draft.vulnerabilities.filter((x) => x !== 'none');
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
    setDraft((p) => ({ ...p, vulnerabilities: next.length === 0 ? ['none'] : next }));
  };

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
        Family Health Vulnerabilities
      </label>
      <div className="grid grid-cols-2 gap-2">
        {VULNERABILITY_OPTIONS.map(({ key, label, icon: Icon }) => {
          const active = draft.vulnerabilities.includes(key as Vulnerability);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleVuln(key as Vulnerability)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-2 transition ${
                active
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HomeAirSection({ draft, setDraft }: SectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        Home Air Setup
      </label>
      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-1.5">
          Air Purifier Availability
        </span>
        <div className="grid grid-cols-3 gap-2">
          {PURIFIER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDraft((p) => ({ ...p, purifier: key as PurifierSetup }))}
              className={`px-2.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                draft.purifier === key
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-3">
        <div>
          <div className="text-xs font-semibold text-slate-800">Kitchen Exhaust Fan / Chimney</div>
          <div className="text-[11px] text-slate-500">
            Crucial for trapping tadka &amp; frying PM2.5
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={draft.kitchenExhaust}
            onChange={(e) => setDraft((p) => ({ ...p, kitchenExhaust: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700" />
        </label>
      </div>
    </div>
  );
}

export function CommuteSection({ draft, setDraft }: SectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        Daily Commute
      </label>
      <div className="grid grid-cols-2 gap-2">
        {COMMUTE_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setDraft((p) => ({ ...p, commuteMode: key as CommuteMode }))}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-2 transition ${
              draft.commuteMode === key
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div
        className={`bg-stone-50 border border-stone-200 rounded-xl p-3 transition ${
          draft.commuteMode === 'wfh' ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
          <span>Daily Round-Trip Distance</span>
          <span className="text-teal-800 font-bold">{draft.commuteKm} km</span>
        </div>
        <input
          type="range"
          min="4"
          max="40"
          step="2"
          value={draft.commuteKm}
          onChange={(e) => setDraft((p) => ({ ...p, commuteKm: Number(e.target.value) }))}
          className="w-full cursor-pointer accent-teal-700"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>4 km</span>
          <span>20 km</span>
          <span>40 km</span>
        </div>
      </div>
    </div>
  );
}

export function BudgetSection({ draft, setDraft }: SectionProps) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
        Recommended Solution Budget Tier
      </label>
      <div className="space-y-2">
        {BUDGET_OPTIONS.map(({ key, title, desc }) => (
          <button
            key={key}
            type="button"
            onClick={() => setDraft((p) => ({ ...p, budgetTier: key as BudgetTier }))}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition ${
              draft.budgetTier === key
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="text-xs font-bold">{title}</div>
            <div className="text-[11px] opacity-80">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
