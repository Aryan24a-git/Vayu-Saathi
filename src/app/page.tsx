// Satisfies: REQ-001, REQ-002, REQ-003, REQ-004, REQ-007, REQ-010, REQ-015
'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/shared/Header';
import { AqiBadge } from '@/components/aqi/AqiBadge';
import { ProfileWizard } from '@/components/profile/ProfileWizard';
import { PlanCard } from '@/components/plan/PlanCard';
import { CommunityCalculator } from '@/components/community/CommunityCalculator';
import { FollowUpChat } from '@/components/plan/FollowUpChat';
import { createDefaultProfile, type Profile } from '@/domain/profile';
import type { AqiReading } from '@/lib/providers/aqi';
import type { GeneratedPlan } from '@/lib/ai/planner';

const LOCAL_STORAGE_KEY = 'cac_household_profile_v1';

export default function HomePage() {
  const [profile, setProfile] = useState<Profile>(createDefaultProfile());
  const [reading, setReading] = useState<AqiReading>({
    aqi: 220,
    pm25: 160,
    timestamp: new Date().toISOString(),
    source: 'Default IGP Winter Smog Baseline',
    isFallback: false,
    isStale: false,
  });
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved local profile on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch {
      // Local storage unreadable, continue with default
    }
  }, []);

  // Fetch plan whenever profile or AQI changes
  useEffect(() => {
    let active = true;
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, aqi: reading.aqi }),
        });
        if (res.ok && active) {
          const data = await res.json();
          setPlan(data);
        }
      } catch {
        // Fallback or error handled gracefully
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPlan();
    return () => { active = false; };
  }, [profile, reading.aqi]);

  const handleProfileSave = (newProfile: Profile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProfile));
    } catch {
      // Handle private browsing storage limitations
    }
  };

  const handleResetProfile = () => {
    const def = createDefaultProfile();
    setProfile(def);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleCitySearch = async (city: string) => {
    try {
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(city)}`);
      const cities = await geoRes.json();
      if (cities && cities.length > 0) {
        const first = cities[0];
        const aqiRes = await fetch(`/api/aqi?lat=${first.latitude}&lon=${first.longitude}`);
        if (aqiRes.ok) {
          const newReading = await aqiRes.json();
          setReading(newReading);
        }
      }
    } catch {
      // Handle search failure gracefully
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header onReset={handleResetProfile} />

      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        <AqiBadge
          reading={reading}
          onManualAqiChange={(newAqi) => setReading((prev) => ({ ...prev, aqi: newAqi }))}
          onCitySearch={handleCitySearch}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <ProfileWizard initialProfile={profile} onSave={handleProfileSave} />
            <CommunityCalculator />
          </div>

          <div className="md:col-span-2 space-y-6">
            {loading && !plan ? (
              <div aria-live="polite" className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                Building your tailored action plan...
              </div>
            ) : plan ? (
              <PlanCard plan={plan} />
            ) : null}

            <FollowUpChat />
          </div>
        </div>
      </main>
    </div>
  );
}
