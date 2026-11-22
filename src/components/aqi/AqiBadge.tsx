// Satisfies: REQ-001, REQ-003, A11Y-002, EC-006
'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, AlertOctagon, Flame, Search, MapPin } from 'lucide-react';
import { classifyAqi } from '@/domain/aqi-bands';
import type { AqiReading } from '@/lib/providers/aqi';

interface AqiBadgeProps {
  reading: AqiReading;
  onManualAqiChange: (val: number) => void;
  onCitySearch: (city: string) => void;
}

function getIcon(level: number) {
  if (level <= 1) return <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />;
  if (level <= 3) return <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />;
  if (level <= 5) return <AlertOctagon className="w-5 h-5 text-purple-600" aria-hidden="true" />;
  return <Flame className="w-5 h-5 text-rose-700 animate-pulse" aria-hidden="true" />;
}

export function AqiBadge({ reading, onManualAqiChange, onCitySearch }: AqiBadgeProps) {
  const [cityInput, setCityInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const band = classifyAqi(reading.aqi);

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim().length >= 2) onCitySearch(cityInput.trim());
  };

  return (
    <section
      aria-labelledby="aqi-heading"
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2
            id="aqi-heading"
            className="text-sm font-semibold uppercase tracking-wider text-slate-500"
          >
            Current Air Quality
          </h2>
          <div className="flex items-center gap-3 mt-1">
            {getIcon(band.escalationLevel)}
            <span className="text-3xl font-extrabold text-slate-900">AQI {reading.aqi}</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-300">
              {band.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            PM2.5: <strong className="text-slate-700">{reading.pm25} µg/m³</strong> · Source:{' '}
            {reading.source}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleCitySubmit} className="flex items-center gap-1">
            <label htmlFor="city-search" className="sr-only">
              Search City
            </label>
            <input
              id="city-search"
              type="text"
              placeholder="Search city (e.g. Delhi)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" /> Find
            </button>
          </form>

          <button
            onClick={() => setShowManual(!showManual)}
            className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2 ml-1"
          >
            {showManual ? 'Hide' : 'Manual Entry'}
          </button>
        </div>
      </div>

      {showManual && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
          <label htmlFor="manual-aqi" className="text-xs font-medium text-slate-700">
            Override AQI:
          </label>
          <input
            id="manual-aqi"
            type="number"
            min="0"
            max="999"
            defaultValue={reading.aqi}
            onChange={(e) => onManualAqiChange(Number(e.target.value) || 0)}
            className="w-24 px-2 py-1 text-xs rounded border border-slate-300"
          />
          <span className="text-xs text-slate-400">0 - 999 (Simulate winter smog levels)</span>
        </div>
      )}
    </section>
  );
}
