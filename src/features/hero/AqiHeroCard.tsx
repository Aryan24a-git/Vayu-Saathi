'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import type { LocationScenario, CalculatedImpact } from '@/domain/scenarios';

interface AqiHeroCardProps {
  location: LocationScenario;
  impact: CalculatedImpact;
}

export function AqiHeroCard({ location, impact }: AqiHeroCardProps) {
  const { naqi, dominant, band, cigsPerDay } = impact.aqi;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between">
      <div
        className="h-2 w-full transition-colors duration-300"
        style={{ backgroundColor: band.color }}
      />

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  location.isSynthetic
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-stone-100 text-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    location.isSynthetic ? 'bg-amber-600' : 'bg-teal-600'
                  }`}
                />
                {location.isSynthetic ? 'Demo scenario (synthetic data)' : location.sourceLabel}
              </span>
              <span className="text-[11px] font-medium text-slate-700">Dominant: {dominant}</span>
            </div>
            <h2 className="font-bold text-xl text-slate-900 mt-1.5">{location.city}</h2>
            <p className="text-xs text-slate-600 mt-0.5">{location.subtitle}</p>
          </div>

          <div className="text-right shrink-0">
            <div
              className="inline-flex flex-col items-center justify-center px-4 py-2 rounded-2xl text-white shadow-sm min-w-[92px] transition-colors duration-300"
              style={{ backgroundColor: band.color }}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
                CPCB NAQI
              </span>
              <span className="font-extrabold text-3xl leading-none mt-0.5">{naqi}</span>
            </div>
            <div className="text-xs font-bold mt-1.5 text-center" style={{ color: band.color }}>
              {band.label}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-center">
            <div className="text-[11px] text-slate-600 font-medium">PM2.5</div>
            <div className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">
              {location.pm25}
            </div>
            <div className="text-[10px] text-slate-600 font-medium">µg/m³</div>
          </div>
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-center">
            <div className="text-[11px] text-slate-600 font-medium">PM10</div>
            <div className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">
              {location.pm10}
            </div>
            <div className="text-[10px] text-slate-600 font-medium">µg/m³</div>
          </div>
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-center">
            <div className="text-[11px] text-slate-600 font-medium">NO₂</div>
            <div className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">
              {location.no2}
            </div>
            <div className="text-[10px] text-slate-600 font-medium">µg/m³</div>
          </div>
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-center">
            <div className="text-[11px] text-slate-600 font-medium">Wind</div>
            <div className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">
              {location.wind}
            </div>
            <div className="text-[10px] text-slate-600 font-medium">km/h</div>
          </div>
        </div>

        <div
          className="rounded-xl p-3.5 border flex items-start gap-3 transition-colors"
          style={{ backgroundColor: band.softBg, borderColor: band.border }}
        >
          <div className="p-2 rounded-lg bg-white/80 shadow-sm shrink-0">
            <Activity className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-xs leading-relaxed">
            <div className="font-bold text-slate-900">
              Unprotected Outdoor Equivalent:{' '}
              <span className="underline decoration-2">{cigsPerDay.toFixed(1)}</span> cigarettes/day
            </div>
            <p className="text-slate-600 mt-0.5">
              Berkeley Earth formula (PM2.5 ÷ 22). {band.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
