// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import catalogData from '../../src/catalog/catalog.json';
import type { Action } from '../../src/catalog/catalog.schema';
import { ActionCard } from '../../src/features/plan/ActionCard';
import { IndoorsTab } from '../../src/features/plan/IndoorsTab';
import { AssistantBox } from '../../src/features/assistant/AssistantBox';
import { planToText } from '../../src/features/share/planToText';
import { communityEstimateText } from '../../src/features/community/communityText';
import { createDefaultProfile } from '../../src/domain/profile';
import type { NormalizedPlan } from '../../src/features/plan/usePlan';

const actions = catalogData.actions as readonly Action[];
const free = actions.find((action) => action.budgetTier === 'free')!;
const paid = actions.find((action) => action.budgetTier === 'medium')!;

const plan: NormalizedPlan = {
  headline: 'Protective plan for Unhealthy',
  effectiveBandLabel: 'Unhealthy',
  isFallback: true,
  isOfflineCache: false,
  generatedAt: '2026-11-22T12:00:00Z',
  source: 'Open-Meteo',
  routineWindow: null,
  routine: [
    {
      action: free,
      priority: 1,
      optional: false,
      explanationRange: '10–30 %',
      timeOfDay: 'morning',
    },
  ],
  indoors: [
    {
      action: free,
      priority: 1,
      optional: false,
      explanationRange: '10–30 %',
      timeOfDay: 'daytime',
    },
    { action: paid, priority: 2, optional: true, explanationRange: '50–85 %', timeOfDay: 'night' },
  ],
  alternatives: [],
  redFlagCopy: 'Seek immediate medical care for severe breathing symptoms.',
  candidateActionIds: [free.id, paid.id],
};

describe('plan UI', () => {
  it('shows ActionCard impact in four explicit lines', () => {
    render(
      <ActionCard
        item={{
          action: free,
          priority: 1,
          optional: false,
          explanationRange: '10–30 %',
          timeOfDay: 'morning',
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle impact details' }));
    expect(screen.getByText(/What changes:/)).toBeTruthy();
    expect(screen.getByText(/How much:/)).toBeTruthy();
    expect(screen.getByText(/Why we think so:/)).toBeTruthy();
    expect(screen.getByText(/How sure we are:/)).toBeTruthy();
  });

  it('defaults free-budget IndoorsTab to no paid actions', () => {
    const profile = createDefaultProfile();
    profile.budgetBand = 'none';
    render(<IndoorsTab items={plan.indoors} profile={profile} />);
    expect(screen.queryByText(paid.title)).toBeNull();
  });

  it('static assistant FAQ works when AI consent is declined', () => {
    render(<AssistantBox />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Allow AI assistance' }));
    fireEvent.change(screen.getByLabelText('Question'), {
      target: { value: 'How should I ventilate indoors?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getAllByText(/Static catalog guidance:/).length).toBeGreaterThan(0);
  });

  it('creates plain-text share content without coordinates or profile', () => {
    const text = planToText(plan, {
      aqi: 175,
      pm25: 72,
      timestamp: '2026-11-22T12:00:00Z',
      source: 'Open-Meteo',
      isFallback: false,
      isStale: false,
    });
    expect(text).toContain('Air quality: 175 AQI');
    expect(text).not.toContain('latitude');
    expect(text).not.toContain('longitude');
  });

  it('formats community ranges with assumptions', () => {
    expect(communityEstimateText(100, 20, 40, '%')).toContain('20–40 %');
  });
});
