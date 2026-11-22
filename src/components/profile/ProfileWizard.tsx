// Satisfies: REQ-002, DATA-001, DATA-002, A11Y-003
'use client';

import React, { useState } from 'react';
import type { Profile, VulnerabilityFlag, BudgetBand, HousingType, CookingFuel } from '@/domain/profile';
import { PROFILE_SCHEMA_VERSION } from '@/domain/profile';

interface ProfileWizardProps {
  initialProfile: Profile;
  onSave: (p: Profile) => void;
}

export function ProfileWizard({ initialProfile, onSave }: ProfileWizardProps) {
  const [housing, setHousing] = useState<HousingType>(initialProfile.housingType);
  const [cooking, setCooking] = useState<CookingFuel>(initialProfile.cookingFuel);
  const [budget, setBudget] = useState<BudgetBand>(initialProfile.budgetBand);
  const [hasPurifier, setHasPurifier] = useState<boolean>(initialProfile.hasPurifier);
  const [flags, setFlags] = useState<VulnerabilityFlag[]>(
    initialProfile.members.flatMap((m) => m.vulnerabilityFlags)
  );

  const toggleFlag = (flag: VulnerabilityFlag) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Profile = {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      housingType: housing,
      cookingFuel: cooking,
      budgetBand: budget,
      hasPurifier,
      heatingType: initialProfile.heatingType,
      commuteTypes: initialProfile.commuteTypes,
      members: [
        {
          ageBand: flags.includes('elderly') ? 'elderly' : 'adult',
          vulnerabilityFlags: flags,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Household Profile</h2>
        <p className="text-xs text-slate-500">Stored only on your device. Tailors your daily routine and budget.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Vulnerabilities in Household
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(['asthma', 'heart_disease', 'lung_disease', 'elderly', 'infant', 'pregnant'] as VulnerabilityFlag[]).map((f) => (
            <label key={f} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={flags.includes(f)}
                onChange={() => toggleFlag(f)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="capitalize">{f.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="housing-select" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Housing Sealing
          </label>
          <select
            id="housing-select"
            value={housing}
            onChange={(e) => setHousing(e.target.value as HousingType)}
            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
          >
            <option value="well_sealed">Well sealed (A/C, tightly fitted)</option>
            <option value="average">Average (typical masonry, some gaps)</option>
            <option value="poorly_sealed">Poorly sealed (cracks, unsealed doors)</option>
            <option value="open">Open / Natural airflow</option>
          </select>
        </div>

        <div>
          <label htmlFor="cooking-select" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Cooking Fuel
          </label>
          <select
            id="cooking-select"
            value={cooking}
            onChange={(e) => setCooking(e.target.value as CookingFuel)}
            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
          >
            <option value="lpg">LPG / Piped Gas</option>
            <option value="electric">Electric / Induction</option>
            <option value="kerosene">Kerosene</option>
            <option value="biomass">Biomass / Wood / Cow Dung</option>
          </select>
        </div>

        <div>
          <label htmlFor="budget-select" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Budget for Air Quality
          </label>
          <select
            id="budget-select"
            value={budget}
            onChange={(e) => setBudget(e.target.value as BudgetBand)}
            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
          >
            <option value="none">Zero budget (Free actions only)</option>
            <option value="low">Low (&lt; ₹500/month: DIY, strips, N95)</option>
            <option value="medium">Medium (₹500 - ₹2000/mo: filters)</option>
            <option value="high">High (&gt; ₹2000/mo: purifiers, HVAC)</option>
          </select>
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={hasPurifier}
              onChange={(e) => setHasPurifier(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            Already own an air purifier
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition"
      >
        Update Plan
      </button>
    </form>
  );
}
