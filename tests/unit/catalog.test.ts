// Satisfies: TEST-001, DATA-004, D3, D4, D6
import { describe, it, expect } from 'vitest';
import {
  ACTION_CATALOG,
  ActionEntrySchema,
  getActionById,
  getActionsBySection,
  getAllActionIds,
} from '../../src/domain/catalog';

const BANNED_PATTERNS = [
  /ozone\s*generator/i,
  /ionizer/i,
  /open\s*windows?\s*(during|at)\s*peak/i,
  /plant.*(clean|purif).*air/i,
  /prescribe/i,
  /antibiotic/i,
  /steroid\s*inhaler/i,
  /cure\s*asthma/i,
];

describe('Action Catalog Integrity & Safety', () => {
  it('validates every action against ActionEntrySchema', () => {
    expect(ACTION_CATALOG.length).toBeGreaterThanOrEqual(25);

    for (const action of ACTION_CATALOG) {
      const parsed = ActionEntrySchema.safeParse(action);
      expect(parsed.success, `Action ${action.id} failed schema validation`).toBe(true);
    }
  });

  it('guarantees every action has a non-empty sourceNote and low <= high (DATA-004)', () => {
    for (const action of ACTION_CATALOG) {
      const { impact } = action;

      expect(impact.sourceNote, `Action ${action.id} missing sourceNote`).toBeDefined();
      expect(
        impact.sourceNote.trim().length,
        `Action ${action.id} sourceNote is empty`
      ).toBeGreaterThanOrEqual(5);

      if (impact.effectFraction) {
        expect(
          impact.effectFraction.low,
          `Action ${action.id} low fraction exceeds high`
        ).toBeLessThanOrEqual(impact.effectFraction.high);
      }

      if (impact.amount) {
        expect(
          impact.amount.low,
          `Action ${action.id} low amount exceeds high`
        ).toBeLessThanOrEqual(impact.amount.high);
      }
    }
  });

  it('verifies unique sequential action IDs matching ACT-XXX format', () => {
    const ids = ACTION_CATALOG.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    for (const id of ids) {
      expect(id).toMatch(/^ACT-\d{3}$/);
    }
  });

  it('provides working catalog lookup and filtering helpers', () => {
    const action1 = getActionById('ACT-001');
    expect(action1).toBeDefined();
    expect(action1?.id).toBe('ACT-001');

    const todayActions = getActionsBySection('today');
    expect(todayActions.length).toBeGreaterThan(0);
    expect(todayActions.every((a) => a.section === 'today')).toBe(true);

    const allIds = getAllActionIds();
    expect(allIds.length).toBe(ACTION_CATALOG.length);
    expect(allIds).toContain('ACT-001');
  });

  it('enforces safety guard: zero banned or harmful advice patterns (D3)', () => {
    for (const action of ACTION_CATALOG) {
      const serialized = JSON.stringify(action);
      for (const pattern of BANNED_PATTERNS) {
        expect(
          pattern.test(serialized),
          `Action ${action.id} violates safety policy by matching banned pattern ${pattern}`
        ).toBe(false);
      }
    }
  });
});
