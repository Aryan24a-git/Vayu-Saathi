import type { Action } from '../catalog/catalog.schema';
import { formatImpactForDisplay } from './impact-model';

export interface ActionExplanation {
  headline: string;
  impact: ReturnType<typeof formatImpactForDisplay>;
  feasibility: string;
  disclaimer: string;
}

export function explainAction(action: Action, pm25: number): ActionExplanation {
  const impact = formatImpactForDisplay(action.impact);
  const factor = pm25 > 0 ? Math.min(pm25 / 150, 2) : 1;
  const low = Math.round(action.impact.magnitudeRange.low * factor);
  const high = Math.round(action.impact.magnitudeRange.high * factor);
  return {
    headline: action.shortDescription,
    impact: {
      ...impact,
      rangeText: `${low}–${high} ${action.impact.magnitudeRange.unit}`,
    },
    feasibility: action.feasibilityNote,
    disclaimer:
      'This is a protective estimate, not a medical prediction or treatment recommendation.',
  };
}
