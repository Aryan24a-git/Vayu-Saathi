'use client';

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { HouseholdProfile } from '@/domain/scenarios';
import { useFocusTrap } from './useFocusTrap';
import {
  VulnerabilitySection,
  HomeAirSection,
  CommuteSection,
  BudgetSection,
} from './profileSections';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile;
  onSaveProfile: (profile: HouseholdProfile) => void;
  onClearData?: () => void;
}

function ProfileDrawerBody({
  onClose,
  profile,
  onSaveProfile,
  onClearData,
}: Omit<ProfileDrawerProps, 'isOpen'>) {
  const [draft, setDraft] = useState<HouseholdProfile>(profile);
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(true, containerRef, onClose);

  const handleSave = () => {
    onSaveProfile(draft);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-drawer-title"
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white shadow-2xl border-l border-stone-200 flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 id="profile-drawer-title" className="font-bold text-lg text-slate-900">
              60-Second Household Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved locally in your browser. Personalizes hacks &amp; impact math.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile drawer"
            className="p-2 rounded-xl hover:bg-stone-100 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <VulnerabilitySection draft={draft} setDraft={setDraft} />
          <HomeAirSection draft={draft} setDraft={setDraft} />
          <CommuteSection draft={draft} setDraft={setDraft} />
          <BudgetSection draft={draft} setDraft={setDraft} />
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-2">
          {onClearData ? (
            <button
              type="button"
              onClick={() => {
                onClearData();
                onClose();
              }}
              className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
            >
              Clear my data
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Recalculates playbook immediately.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition"
          >
            Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileDrawer({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onClearData,
}: ProfileDrawerProps) {
  if (!isOpen) return null;
  return (
    <ProfileDrawerBody
      key={JSON.stringify(profile)}
      onClose={onClose}
      profile={profile}
      onSaveProfile={onSaveProfile}
      onClearData={onClearData}
    />
  );
}
