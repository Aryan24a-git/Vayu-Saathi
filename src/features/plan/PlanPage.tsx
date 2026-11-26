'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/shared/Header';
import {
  createDefaultProfile,
  getAllVulnerabilityFlags,
  ProfileSchema,
  type Profile,
} from '@/domain/profile';
import type { AqiReading } from '@/domain/aqi-bands';
import { AirQualityCard } from './AirQualityCard';
import { PlanTabs } from './PlanTabs';
import { SafetyNotice } from './SafetyNotice';
import { usePlan } from './usePlan';
import { ShareBar } from '../share/ShareBar';

const CommunityCalculator = dynamic(
  () => import('../community/CommunityCalculator').then((module) => module.CommunityCalculator),
  { ssr: false, loading: () => <p className="text-sm">Loading community calculator…</p> }
);
const AssistantBox = dynamic(
  () => import('../assistant/AssistantBox').then((module) => module.AssistantBox),
  { ssr: false, loading: () => <p className="text-sm">Loading assistant…</p> }
);

const PROFILE_KEY = 'cac_household_profile_v1';

export function PlanPage() {
  const [profile, setProfile] = useState<Profile>(createDefaultProfile());
  const [city, setCity] = useState('');
  const [reading, setReading] = useState<AqiReading>({
    aqi: 175,
    pm25: 72,
    timestamp: '2026-11-22T12:00:00Z',
    source: 'Open-Meteo fallback baseline',
    isFallback: false,
    isStale: false,
  });
  const [askQuestion, setAskQuestion] = useState('');
  const { state, plan, retryAfter } = usePlan(profile, reading);

  useEffect(() => {
    document.querySelector<HTMLElement>('h1')?.focus();
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const parsed = ProfileSchema.safeParse(JSON.parse(saved));
        if (parsed.success) setProfile(parsed.data);
      }
    } catch {
      // Keep the safe default profile.
    }
  }, []);

  const searchCityByName = async () => {
    if (city.trim().length < 2) return;
    try {
      const geoResponse = await fetch(`/api/geocode?q=${encodeURIComponent(city.trim())}`);
      const results: unknown = await geoResponse.json();
      if (!Array.isArray(results) || results.length === 0) return;
      const first = results[0];
      if (typeof first !== 'object' || first === null) return;
      const record = first as Record<string, unknown>;
      if (typeof record['latitude'] !== 'number' || typeof record['longitude'] !== 'number') return;
      const aqiResponse = await fetch(
        `/api/air-quality?lat=${record['latitude']}&lon=${record['longitude']}`
      );
      if (!aqiResponse.ok) {
        setReading((current) => ({ ...current, isFallback: true, isStale: true }));
        return;
      }
      const next: unknown = await aqiResponse.json();
      if (typeof next === 'object' && next !== null) setReading(next as AqiReading);
    } catch {
      setReading((current) => ({ ...current, isFallback: true, isStale: true }));
    }
  };

  const sensitive = getAllVulnerabilityFlags(profile).size > 0;
  return (
    <div className="flex-1">
      <Header />
      <main id="main-content" className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <section aria-labelledby="page-heading">
          <h1 id="page-heading" tabIndex={-1} className="text-2xl font-bold">
            {plan?.headline ?? 'Building your protective plan'}
          </h1>
          {plan?.isFallback && (
            <p className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm">
              Basic plan
            </p>
          )}
        </section>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void searchCityByName();
          }}
          className="flex flex-wrap gap-2"
        >
          <label htmlFor="plan-city" className="sr-only">
            City
          </label>
          <input
            id="plan-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City name"
            className="min-h-11 rounded border px-3"
          />
          <button type="submit" className="min-h-11 rounded bg-slate-800 px-4 text-sm text-white">
            Find air quality
          </button>
        </form>
        <AirQualityCard
          reading={reading}
          onManualAqi={(aqi) =>
            setReading((current) => ({
              ...current,
              aqi,
              isFallback: true,
              isStale: true,
            }))
          }
        />
        {state === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border p-6 text-sm text-slate-600"
          >
            Loading your plan…
          </div>
        )}
        {state === 'success' && plan && (
          <p role="status" aria-live="polite" className="sr-only">
            Your personalized plan is ready.
          </p>
        )}
        {state === 'offline' && plan?.isOfflineCache && (
          <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
            Offline: showing your last saved plan. This may be stale.
          </p>
        )}
        {state === 'provider_down' && (
          <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
            Live data is unavailable. Enter a manual AQI above to continue.
          </p>
        )}
        {state === 'validation' && (
          <p role="alert" className="text-sm">
            Check the city and profile values before retrying.
          </p>
        )}
        {state === 'rate_limited' && (
          <p role="alert" className="text-sm">
            Too many requests. Retry in {retryAfter} seconds.
          </p>
        )}
        {sensitive && <SafetyNotice redFlagCopy={plan?.redFlagCopy ?? ''} />}
        {plan && (
          <>
            {plan.isFallback && (
              <p className="rounded-lg bg-blue-50 p-3 text-sm">
                Basic plan: the live assistant is unavailable, so this plan uses the offline rules
                engine.
              </p>
            )}
            <PlanTabs plan={plan} profile={profile} onAsk={setAskQuestion} />
            <ShareBar plan={plan} reading={reading} />
            <CommunityCalculator />
          </>
        )}
        <AssistantBox initialQuestion={askQuestion} />
      </main>
    </div>
  );
}
