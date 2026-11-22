// Satisfies: A11Y-001, EC-006
'use client';

import React from 'react';
import { Wind } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white"
            aria-hidden="true"
          >
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Clear Air Companion</h1>
            <p className="text-xs text-slate-500">Winter Smog Decision Support</p>
          </div>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 transition"
          >
            Reset Profile
          </button>
        )}
      </div>
    </header>
  );
}
