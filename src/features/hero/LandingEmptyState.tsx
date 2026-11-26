// Live-data-first landing view shown when no city is loaded yet, while loading, or on error.
// Satisfies: REQ-001, REQ-003, REQ-023, A11Y-001
'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Edit3, AlertTriangle, RefreshCw, FlaskConical } from 'lucide-react';

const QUICK_CITIES = ['Delhi', 'Lucknow', 'Patna', 'Kolkata', 'Mumbai', 'Bengaluru', 'Jaipur'];

interface LandingEmptyStateProps {
  isLoading: boolean;
  error: string | null;
  lastCityQuery: string | null;
  onFetchCity: (city: string) => Promise<void>;
  onUseGeolocation: () => Promise<void>;
  onManualPm25: (pm25: number) => void;
  onSelectDemo: (key: string) => void;
}

export function LandingEmptyState({
  isLoading,
  error,
  lastCityQuery,
  onFetchCity,
  onUseGeolocation,
  onManualPm25,
  onSelectDemo,
}: LandingEmptyStateProps) {
  const [query, setQuery] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [manualPm, setManualPm] = useState('180');

  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Loading live air quality"
        className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 animate-pulse"
      >
        <div className="h-6 w-56 bg-stone-200 rounded-lg" />
        <div className="h-24 bg-stone-100 rounded-xl" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-14 bg-stone-100 rounded-xl" />
          <div className="h-14 bg-stone-100 rounded-xl" />
          <div className="h-14 bg-stone-100 rounded-xl" />
          <div className="h-14 bg-stone-100 rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Select your city for live air quality"
      className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5"
    >
      <div className="space-y-1">
        <h2 className="font-bold text-xl text-slate-900">
          Check live winter air quality for your city
        </h2>
        <p className="text-sm text-slate-600">
          Search any Indian city to fetch live Open-Meteo air quality &amp; 24-hour dispersion data,
          or use your approximate location.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </span>
          <div className="flex items-center gap-2">
            {lastCityQuery && (
              <button
                type="button"
                onClick={() => onFetchCity(lastCityQuery)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-700 text-white font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-semibold text-amber-900"
            >
              Enter AQI manually
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void onFetchCity(query.trim());
        }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Indian city (e.g. Delhi, Lucknow, Patna)..."
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition"
        >
          Check Live Air
        </button>
        <button
          type="button"
          onClick={() => void onUseGeolocation()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-sm font-semibold transition"
        >
          <Navigation className="w-4 h-4" />
          <span>Use my location</span>
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-1">Quick cities:</span>
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => void onFetchCity(city)}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition"
          >
            {city}
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-4 text-xs">
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-teal-800"
        >
          <Edit3 className="w-3.5 h-3.5" /> Enter AQI manually
        </button>
        <button
          type="button"
          onClick={() => setShowDemo((v) => !v)}
          className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900"
        >
          <FlaskConical className="w-3.5 h-3.5" /> Try a demo scenario
        </button>
      </div>

      {showManual && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = Number(manualPm);
            if (Number.isFinite(val) && val > 0) onManualPm25(val);
          }}
          className="flex flex-wrap items-center gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200"
        >
          <label htmlFor="manual-pm25" className="text-xs font-semibold text-slate-700">
            PM2.5 (µg/m³):
          </label>
          <input
            id="manual-pm25"
            type="number"
            min={1}
            max={1000}
            value={manualPm}
            onChange={(e) => setManualPm(e.target.value)}
            className="w-28 px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            Apply Manual Reading
          </button>
        </form>
      )}

      {showDemo && (
        <div className="flex flex-wrap items-center gap-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs">
          <span className="font-semibold text-amber-900">Demo scenario (synthetic data):</span>
          {(['demo:delhi', 'demo:patna', 'demo:kolkata', 'demo:bengaluru'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectDemo(id)}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-semibold text-amber-900 hover:bg-amber-100"
            >
              {id.replace('demo:', '')}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
