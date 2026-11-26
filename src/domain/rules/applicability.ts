import type { Action } from '../../catalog/catalog.schema';
import type { Profile, VulnerabilityFlag } from '../profile';
import { getAllVulnerabilityFlags } from '../profile';

export function isApplicable(
  action: Action,
  profile: Profile,
  effectiveEscalation: number
): boolean {
  if (
    effectiveEscalation < action.minimumEscalationLevel ||
    effectiveEscalation > action.maximumEscalationLevel
  ) {
    return false;
  }
  if (!action.targetHousingTypes.includes(profile.housingType)) return false;
  const flags = getAllVulnerabilityFlags(profile);
  if (!hasRequiredFlags(action.requiredVulnerabilityFlags, flags)) return false;
  if (
    action.cookingFuelRelevance.length > 0 &&
    !action.cookingFuelRelevance.includes(profile.cookingFuel)
  ) {
    return false;
  }
  return !hasExclusion(action, profile);
}

function hasRequiredFlags(
  required: readonly VulnerabilityFlag[],
  flags: ReadonlySet<VulnerabilityFlag>
): boolean {
  return required.every((flag) => flags.has(flag));
}

function hasExclusion(action: Action, profile: Profile): boolean {
  return action.doNotShowWhen.some((condition) => {
    if (condition === `housing_type:${profile.housingType}`) return true;
    if (condition === `budget:${profile.budgetBand}`) return true;
    return condition === `cooking_fuel:${profile.cookingFuel}`;
  });
}
