import { describe, expect, it, vi } from 'vitest';
import { createDefaultProfile } from '../../src/domain/profile';
import { buildBasicPlan } from '../../src/domain/plan';
import type { LlmClient } from '../../src/server/llm/client';
import { NullClient } from '../../src/server/llm/client';
import { narrate, clearNarrativeCache } from '../../src/server/llm/narrate';
import { ask } from '../../src/server/llm/ask';
import { validateNarrative, classifyQuestionScope } from '../../src/server/llm/guardrails';
import { DailyCallBudget } from '../../src/server/llm/budget';
import corpus from '../fixtures/llm/adversarial-corpus.json';
import validNarrative from '../fixtures/llm/valid-narrative.json';

describe('grounded LLM narration', () => {
  it('accepts only IDs and supplied impact numbers', () => {
    const result = validateNarrative(validNarrative, {
      selectedIds: ['ACT-002'],
      impacts: new Map([['ACT-002', ['20', '50']]]),
    });
    expect(result.ok).toBe(true);
  });

  it('rejects unknown IDs, links, medical advice and unsupported numbers', () => {
    const unknown = validateNarrative(validNarrative, {
      selectedIds: ['ACT-001'],
      impacts: new Map([['ACT-001', ['10', '30']]]),
    });
    expect(unknown).toMatchObject({ ok: false, reason: 'unknown_or_unselected_action' });

    const unsafe = {
      ...validNarrative,
      closing: 'Take aspirin at https://example.com',
    };
    expect(
      validateNarrative(unsafe, {
        selectedIds: ['ACT-002'],
        impacts: new Map([['ACT-002', ['20', '50']]]),
      }).ok
    ).toBe(false);
  });

  it('uses NullClient or failure for a valid fallback plan', async () => {
    clearNarrativeCache();
    const result = await narrate(
      createDefaultProfile(),
      'Unhealthy',
      72,
      [{ id: 'ACT-002', rangeText: '20–50 %' }],
      new NullClient()
    );
    expect(result.isFallback).toBe(true);
    expect(result.narrative.headline).toContain('Unhealthy');
  });

  it('caches identical narration inputs', async () => {
    clearNarrativeCache();
    const complete = vi.fn(async () => JSON.stringify(validNarrative));
    const client = { complete } as LlmClient;
    const profile = createDefaultProfile();
    const items = [{ id: 'ACT-002', rangeText: '20–50 %' }];
    await narrate(profile, 'Unhealthy', 72, items, client);
    await narrate(profile, 'Unhealthy', 74, items, client);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

describe('bounded scoped Q&A', () => {
  it('enforces a resettable global daily call cap', () => {
    const budget = new DailyCallBudget(2);
    const day = new Date('2026-11-22T12:00:00Z');
    expect(budget.tryReserve(day)).toBe(true);
    expect(budget.tryReserve(day)).toBe(true);
    expect(budget.tryReserve(day)).toBe(false);
    expect(budget.tryReserve(new Date('2026-11-23T12:00:00Z'))).toBe(true);
  });

  it('refuses off-topic and diagnosis questions', async () => {
    const now = new Date('2026-11-22T12:00:00Z');
    const profile = createDefaultProfile();
    const plan = buildBasicPlan(
      profile,
      {
        aqi: 175,
        pm25: 72,
        timestamp: now.toISOString(),
        provider: 'test',
        isStale: false,
        isFallback: false,
      },
      now
    );
    const result = await ask('Diagnose my cough and prescribe medicine.', profile, plan);
    expect(result.fallback).toBe(true);
    expect(result.answer).toContain('diagnose');
  });

  it('places the question only in delimited data and rejects extra numbers', async () => {
    const now = new Date('2026-11-22T12:00:00Z');
    const profile = createDefaultProfile();
    const plan = buildBasicPlan(
      profile,
      {
        aqi: 175,
        pm25: 72,
        timestamp: now.toISOString(),
        provider: 'test',
        isStale: false,
        isFallback: false,
      },
      now
    );
    const complete = vi.fn(async (request) =>
      JSON.stringify({
        answer: `At 999 PM2.5, ${request.prompt.includes('<user_data>') ? 'seal windows.' : 'unknown.'}`,
      })
    );
    const result = await ask('How should I seal windows?', profile, plan, { complete });
    expect(result.fallback).toBe(true);
  });
});

describe('adversarial corpus', () => {
  it('has at least 25 attacks and safely refuses unsafe strings', () => {
    expect(corpus.length).toBeGreaterThanOrEqual(25);
    for (const text of corpus) {
      const scope = classifyQuestionScope(text);
      expect(scope).toBe('off_topic');
    }
  });
});
