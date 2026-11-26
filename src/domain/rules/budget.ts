import type { Action } from '../../catalog/catalog.schema';
import type { BudgetBand, Profile } from '../profile';

const TIERS: Record<BudgetBand, readonly ('free' | 'low' | 'medium' | 'high')[]> = {
  none: ['free'],
  low: ['free', 'low'],
  medium: ['free', 'low', 'medium'],
  high: ['free', 'low', 'medium', 'high'],
};

export function isWithinBudget(action: Action, profile: Profile): boolean {
  return TIERS[profile.budgetBand].includes(action.budgetTier);
}

export function isOptionalPurchase(action: Action): boolean {
  return action.budgetTier !== 'free';
}
