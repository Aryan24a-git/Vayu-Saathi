'use client';

import React, { useState, useRef, useCallback } from 'react';
import { DoorOpen, Sparkles } from 'lucide-react';
import type { LocationScenario } from '@/domain/scenarios';
import { type VentilationWindow, formatHour12 } from '@/domain/naqi';
import {
  CHART_W,
  CHART_H,
  PAD_L,
  PAD_R,
  PAD_T,
  PAD_B,
  getChartX,
  getChartY,
  buildPolylinePoints,
} from './chartCoordinates';
import { VentilationCallouts } from './VentilationCallouts';

interface DispersionChartProps {
  location: LocationScenario;
  vent: VentilationWindow;
  bandColor: string;
}

export function DispersionChart({ location, vent, bandColor }: DispersionChartProps) {
  const [activeHour, setActiveHour] = useState<number>(vent.startHour);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const pmData = location.hourlyPM25;
  const windData = location.hourlyWind;
  const maxPM = Math.max(...pmData, 100);
  const maxWind = Math.max(...windData, 15);

  const pmPoints = buildPolylinePoints(pmData, maxPM);
  const windPoints = buildPolylinePoints(windData, maxWind);
  const pmArea = `${getChartX(0)},${CHART_H - PAD_B} ${pmPoints} ${getChartX(23)},${CHART_H - PAD_B}`;
  const curX = getChartX(activeHour);
  const isSafeSlot = activeHour >= vent.startHour && activeHour < vent.endHour;

  const handlePointer = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const hour = Math.min(
      23,
      Math.max(0, Math.round(((relX * CHART_W - PAD_L) / (CHART_W - PAD_L - PAD_R)) * 23))
    );
    setActiveHour(hour);
    setIsHovering(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setActiveHour((h) => Math.min(23, h + 1));
    else if (e.key === 'ArrowLeft') setActiveHour((h) => Math.max(0, h - 1));
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900">
              24-Hour Thermal Inversion &amp; Ventilation Curve
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              <Sparkles className="w-3 h-3" /> Interactive
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Hover or scrub across any hour to inspect particulate buildup and safe
            cross-ventilation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveHour(vent.startHour)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0 transition"
        >
          <DoorOpen className="w-4 h-4" />
          <span>Open: {vent.windowLabel}</span>
        </button>
      </div>

      <div className="flex items-center justify-between bg-stone-50 border border-stone-200/90 rounded-xl px-3.5 py-2 mb-2 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-slate-900 text-sm">{formatHour12(activeHour)}</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
              isSafeSlot
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-stone-200 text-slate-700'
            }`}
          >
            {isSafeSlot ? 'Optimal Safe Ventilation' : 'Keep Windows Sealed'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-700">
          <span>
            PM2.5: <strong className="text-slate-900">{pmData[activeHour]} µg/m³</strong>
          </span>
          <span>
            Wind: <strong className="text-sky-700">{windData[activeHour]} km/h</strong>
          </span>
        </div>
      </div>

      <div
        role="region"
        className="relative w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-teal-600 rounded-xl"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="24-hour smog dispersion chart. Use left and right arrow keys to step."
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full h-48 sm:h-52 select-none cursor-crosshair touch-none"
          role="img"
          aria-label="24-hour diurnal air dispersion and NAQI variation curve"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerEnter={() => setIsHovering(true)}
          onPointerLeave={() => setIsHovering(false)}
        >
          <title>24-Hour Diurnal Air Dispersion and NAQI Variation</title>
          <desc>
            Shows hourly PM2.5 particulate levels, wind speed, and the optimal ventilation window
          </desc>
          <defs>
            <linearGradient id="pmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bandColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={bandColor} stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Safe Ventilation Green Band */}
          <rect
            x={getChartX(vent.startHour)}
            y={PAD_T}
            width={getChartX(vent.endHour) - getChartX(vent.startHour)}
            height={CHART_H - PAD_T - PAD_B}
            fill="#10b981"
            fillOpacity="0.18"
          />
          <line
            x1={getChartX(vent.startHour)}
            y1={PAD_T}
            x2={getChartX(vent.startHour)}
            y2={CHART_H - PAD_B}
            stroke="#059669"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1={getChartX(vent.endHour)}
            y1={PAD_T}
            x2={getChartX(vent.endHour)}
            y2={CHART_H - PAD_B}
            stroke="#059669"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          <polygon points={pmArea} fill="url(#pmGradient)" />
          <polyline points={pmPoints} fill="none" stroke={bandColor} strokeWidth="2.5" />
          <polyline
            points={windPoints}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.8"
            strokeDasharray="5 4"
          />

          <line
            x1={curX}
            y1={PAD_T}
            x2={curX}
            y2={CHART_H - PAD_B}
            stroke="#0f172a"
            strokeWidth={isHovering ? 2 : 1.5}
            strokeDasharray="3 3"
          />
          <circle
            cx={curX}
            cy={getChartY(pmData[activeHour], maxPM)}
            r={6}
            fill={bandColor}
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle
            cx={curX}
            cy={getChartY(windData[activeHour], maxWind)}
            r={5}
            fill="#0284c7"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {[0, 4, 8, 12, 16, 20, 23].map((hr) => (
            <text
              key={hr}
              x={getChartX(hr)}
              y={CHART_H - 10}
              textAnchor="middle"
              fill="#334155"
              fontSize="10"
              fontWeight={activeHour === hr ? 'bold' : 'normal'}
            >
              {hr === 0 ? '12A' : hr === 12 ? '12P' : hr < 12 ? `${hr}A` : `${hr - 12}P`}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-1.5 pt-2 pb-1 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          Jump:
        </span>
        {[6, 9, vent.startHour, vent.sealHour, 21].map((hr) => (
          <button
            key={hr}
            type="button"
            onClick={() => setActiveHour(hr)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
              activeHour === hr
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
            }`}
          >
            {formatHour12(hr)}{' '}
            {hr === vent.startHour ? '🌿 Vent' : hr === vent.sealHour ? '🔒 Seal' : ''}
          </button>
        ))}
      </div>

      <VentilationCallouts vent={vent} />
    </div>
  );
}
