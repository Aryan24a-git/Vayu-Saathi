import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { AqiReading } from '@/lib/providers/aqi';
import { classifyAqi } from '@/domain/aqi-bands';

export interface AirQualityCardProps {
  reading: AqiReading;
  trend?: string;
  onManualAqi: (aqi: number) => void;
}

export function AirQualityCard({
  reading,
  trend = 'Trend unavailable',
  onManualAqi,
}: AirQualityCardProps) {
  const band = classifyAqi(reading.aqi);
  const Icon = band.escalationLevel <= 1 ? CheckCircle2 : AlertTriangle;
  return (
    <section
      aria-labelledby="air-quality-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="air-quality-heading" className="text-sm font-bold text-slate-700">
            Today&apos;s air quality
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <Icon className="h-6 w-6" aria-hidden="true" />
            <strong className="text-2xl">{band.label}</strong>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-sm">AQI {reading.aqi}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">PM2.5: {reading.pm25} µg/m³</p>
          <p className="text-sm text-slate-600">{trend}</p>
        </div>
        {reading.isFallback && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs">Manual fallback</span>
        )}
        {reading.isStale && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs">Stale</span>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Source: {reading.source} · Observed: {new Date(reading.timestamp).toLocaleString()}
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-blue-700">
          Enter manual AQI
        </summary>
        <label htmlFor="manual-aqi" className="mt-2 block text-sm">
          Manual AQI
        </label>
        <input
          id="manual-aqi"
          type="number"
          min="0"
          max="999"
          defaultValue={reading.aqi}
          onChange={(event) => onManualAqi(Number(event.target.value))}
          className="mt-1 min-h-11 w-28 rounded border border-slate-300 px-3"
        />
      </details>
    </section>
  );
}
