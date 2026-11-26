'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'playbook' | 'copilot' | 'community';
  onTabChange: (tab: 'playbook' | 'copilot' | 'community') => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-3 gap-1" role="tablist" aria-label="Mobile Navigation Tabs">
        <button
          type="button"
          onClick={() => onTabChange('playbook')}
          role="tab"
          aria-selected={activeTab === 'playbook'}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition ${
            activeTab === 'playbook'
              ? 'bg-teal-50 text-teal-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Playbook</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('copilot')}
          role="tab"
          aria-selected={activeTab === 'copilot'}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition ${
            activeTab === 'copilot'
              ? 'bg-teal-50 text-teal-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span>Ask AI &amp; Audit</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('community')}
          role="tab"
          aria-selected={activeTab === 'community'}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition ${
            activeTab === 'community'
              ? 'bg-teal-50 text-teal-800'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Community</span>
        </button>
      </div>
    </nav>
  );
}
