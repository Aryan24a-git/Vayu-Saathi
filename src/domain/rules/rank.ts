import type { Action } from '../../catalog/catalog.schema';
import type { Profile } from '../profile';
import { getAllVulnerabilityFlags } from '../profile';

export function impactScore(action: Action, pm25: number): number {
  const range = action.impact.magnitudeRange;
  const average = (range.low + range.high) / 2;
  const pollutantFactor = pm25 > 0 ? Math.min(pm25 / 150, 2) : 1;
  return average * pollutantFactor;
}

export function effortFor(action: Action): number {
  const effort = { free: 1, low: 2, medium: 4, high: 8 };
  return effort[action.budgetTier];
}

export function rankActions(
  actions: readonly Action[],
  profile: Profile,
  pm25: number
): readonly Action[] {
  const flags = getAllVulnerabilityFlags(profile);
  return [...actions].sort((left, right) => {
    const scoreLeft = scoreAction(left, profile, flags, pm25);
    const scoreRight = scoreAction(right, profile, flags, pm25);
    const scoreDiff = scoreRight - scoreLeft;
    return scoreDiff || left.id.localeCompare(right.id);
  });
}

function scoreAction(
  action: Action,
  profile: Profile,
  flags: ReadonlySet<string>,
  pm25: number
): number {
  const base = impactScore(action, pm25) / effortFor(action);
  const relevance =
    profileCookingRelevance(action, profile) +
    action.targetVulnerabilityFlags.filter((flag) => flags.has(flag)).length;
  const biomass = profile.cookingFuel === 'biomass' && action.id === 'ACT-012' ? 100 : 0;
  return base + relevance + biomass;
}

function profileCookingRelevance(action: Action, profile: Profile): number {
  return action.cookingFuelRelevance.includes(profile.cookingFuel) ? 1 : 0;
}
