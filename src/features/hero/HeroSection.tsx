'use client';

import React from 'react';
import type { LocationScenario, CalculatedImpact } from '@/domain/scenarios';
import type { VentilationWindow } from '@/domain/naqi';
import { AqiHeroCard } from './AqiHeroCard';
import { DispersionChart } from './DispersionChart';

interface HeroSectionProps {
  location: LocationScenario;
  impact: CalculatedImpact;
  vent: VentilationWindow;
}

export function HeroSection({ location, impact, vent }: HeroSectionProps) {
  return (
    <section
      aria-label="Live Air Quality and Ventilation Overview"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
    >
      <div className="lg:col-span-5">
        <AqiHeroCard location={location} impact={impact} />
      </div>
      <div className="lg:col-span-7">
        <DispersionChart location={location} vent={vent} bandColor={impact.aqi.band.color} />
      </div>
    </section>
  );
}
