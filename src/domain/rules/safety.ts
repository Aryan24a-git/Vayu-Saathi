import type { Action } from '../../catalog/catalog.schema';
import type { Profile } from '../profile';
import { getAllVulnerabilityFlags } from '../profile';

export function isSafeAction(
  action: Action,
  profile: Profile,
  aqi: number,
  effectiveEscalation: number
): boolean {
  if (action.id === 'ACT-026') return false;
  if (action.id === 'ACT-003') {
    const sensitive = getAllVulnerabilityFlags(profile).size > 0;
    if (sensitive && effectiveEscalation >= 3) return false;
  }
  if (action.id === 'ACT-004' && aqi > 100) return false;
  if (action.id === 'ACT-006' && profile.hasPurifier) return false;
  if (action.id === 'ACT-006' && profile.housingType === 'well_sealed') return false;
  if (action.id === 'ACT-008' && profile.housingType === 'well_sealed') return false;
  if (action.id === 'ACT-013' && profile.heatingType !== 'wood' && profile.heatingType !== 'coal') {
    return false;
  }
  return true;
}
