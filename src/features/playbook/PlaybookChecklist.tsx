'use client';

import React from 'react';
import { Home, Leaf, Sparkles } from 'lucide-react';
import type { PlaybookItem } from '@/domain/playbookEngine';

interface PlaybookChecklistProps {
  iaqHacks: PlaybookItem[];
  emissionSwaps: PlaybookItem[];
  completedIds: string[];
  onToggle: (id: string) => void;
}

export function PlaybookChecklist({
  iaqHacks,
  emissionSwaps,
  completedIds,
  onToggle,
}: PlaybookChecklistProps) {
  const renderItem = (item: PlaybookItem, accent: 'emerald' | 'sky') => {
    const checked = completedIds.includes(item.id);
    const isAi = item.tag.includes('AI');
    const badgeClass = isAi
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : accent === 'emerald'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-sky-50 text-sky-800 border-sky-200';

    return (
      <label
        key={item.id}
        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition select-none ${
          checked
            ? 'bg-teal-50/60 border-teal-300'
            : isAi
              ? 'bg-indigo-50/20 hover:bg-indigo-50/40 border-indigo-200/70'
              : 'bg-stone-50/70 hover:bg-stone-100/70 border-stone-200/80'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(item.id)}
          className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-600 cursor-pointer shrink-0 accent-teal-700"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`text-xs sm:text-[13px] font-bold leading-snug ${
                checked ? 'line-through text-slate-500' : 'text-slate-900'
              }`}
            >
              {item.title}
            </span>
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}
            >
              {isAi && <Sparkles className="w-2.5 h-2.5 text-indigo-600" />}
              {item.tag}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
        </div>
      </label>
    );
  };

  return (
    <>
      {/* Card A: Indoor Air Quality Hacks */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900">
              Indoor Air Quality Hacks
            </h4>
            <p className="text-[11px] text-slate-500">Protect your family indoors right now</p>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {iaqHacks.map((item) => renderItem(item, 'emerald'))}
        </div>
      </div>

      {/* Card B: Low-Emission Daily Swaps */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900">
              Low-Emission Daily Swaps
            </h4>
            <p className="text-[11px] text-slate-500">Prevent new smoke &amp; tailpipe smog</p>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {emissionSwaps.map((item) => renderItem(item, 'sky'))}
        </div>
      </div>
    </>
  );
}
