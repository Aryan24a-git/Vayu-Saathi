import React from 'react';

export function ImpactMeter({
  low,
  high,
  unit,
  confidence,
}: {
  low: number;
  high: number;
  unit: string;
  confidence: 'high' | 'medium' | 'low';
}) {
  const width = Math.min(100, Math.max(8, high));
  return (
    <div>
      <p className="text-sm font-medium">
        {low}–{high} {unit}
      </p>
      <div className="mt-1 h-2 rounded bg-slate-200" aria-hidden="true">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-600">Estimate, {confidence} confidence</p>
    </div>
  );
}
