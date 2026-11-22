// Satisfies: REQ-004, REQ-005, REQ-006, EC-001, D6
// Action catalog index and query helpers.

import type { ActionEntry, CatalogSection } from './schema';
import { TODAY_ACTIONS } from './actions.today';
import { INDOORS_ACTIONS } from './actions.indoors';
import { ALTERNATIVES_ACTIONS } from './actions.alternatives';

export * from './schema';
export { TODAY_ACTIONS } from './actions.today';
export { INDOORS_ACTIONS } from './actions.indoors';
export { ALTERNATIVES_ACTIONS } from './actions.alternatives';

export const ACTION_CATALOG: readonly ActionEntry[] = [
  ...TODAY_ACTIONS,
  ...INDOORS_ACTIONS,
  ...ALTERNATIVES_ACTIONS,
] as const;

export function getActionById(id: string): ActionEntry | undefined {
  return ACTION_CATALOG.find((action) => action.id === id);
}

export function getActionsBySection(section: CatalogSection): readonly ActionEntry[] {
  return ACTION_CATALOG.filter((action) => action.section === section);
}

export function getAllActionIds(): readonly string[] {
  return ACTION_CATALOG.map((a) => a.id);
}
