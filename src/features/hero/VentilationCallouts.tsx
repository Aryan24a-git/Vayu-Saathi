import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import type { VentilationWindow } from '@/domain/naqi';

interface VentilationCalloutsProps {
  vent: VentilationWindow;
}

export function VentilationCallouts({ vent }: VentilationCalloutsProps) {
  return (
    <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
      <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-emerald-800">
          <strong className="text-emerald-900">Safe Cross-Ventilation: </strong>
          Open windows {vent.windowLabel} (PM2.5 dips to ~{vent.avgWindowPM} µg/m³).
        </p>
      </div>
      <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5">
        <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-amber-800">
          <strong className="text-amber-900">Seal Windows Shut: </strong>
          Close by {vent.sealLabel} before evening thermal inversion.
        </p>
      </div>
    </div>
  );
}
