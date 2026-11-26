import catalogData from '../catalog/catalog.json';
import type { Action } from '../catalog/catalog.schema';
import { classifyAqi, getBandByEscalationLevel } from './aqi-bands';
import { lowestPm25Window } from './forecast';
import type { AirQualitySnapshot } from './types';
import type { Profile } from './profile';
import { hasEarlyEscalationVulnerability, getAllVulnerabilityFlags } from './profile';
import { isApplicable } from './rules/applicability';
import { isWithinBudget, isOptionalPurchase } from './rules/budget';
import { isSafeAction } from './rules/safety';
import { rankActions } from './rules/rank';
import { explainAction, type ActionExplanation } from './explain';

export interface BasicPlanItem {
  actionId: string;
  title: string;
  priority: number;
  timeOfDay: string;
  optional: boolean;
  redFlag: boolean;
  explanation: ActionExplanation;
}

export interface BasicPlan {
  headline: string;
  effectiveBand: string;
  effectiveBandLabel: string;
  escalationLevel: number;
  routine: readonly BasicPlanItem[];
  indoors: readonly BasicPlanItem[];
  alternatives: readonly BasicPlanItem[];
  candidateActionIds: readonly string[];
  redFlagCopy: string;
  medicalDisclaimer: string;
  routineWindow: string | null;
  generatedAt: string;
  isFallback: true;
}

const catalog = catalogData.actions as readonly Action[];

const MEDICAL_DISCLAIMER =
  'This app provides information only, not medical advice. ' +
  'Consult a healthcare provider for medical concerns.';

const RED_FLAG_COPY =
  'If anyone has difficulty breathing, chest pain, blue lips, confusion, or cannot complete a sentence, seek immediate medical care or call emergency services.';

export function buildBasicPlan(
  profile: Profile,
  snapshot: AirQualitySnapshot,
  now: Date
): BasicPlan {
  const baseBand = classifyAqi(snapshot.aqi);
  const vulnerability = hasEarlyEscalationVulnerability(profile);
  const effectiveEscalation = Math.min(baseBand.escalationLevel + (vulnerability ? 1 : 0), 6);
  const effectiveBand = getBandByEscalationLevel(effectiveEscalation);
  const eligible = rankActions(
    catalog.filter(
      (action) =>
        isApplicable(action, profile, effectiveEscalation) &&
        isWithinBudget(action, profile) &&
        isSafeAction(action, profile, snapshot.aqi, effectiveEscalation)
    ),
    profile,
    snapshot.pm25
  );
  const routine = capSection(
    eligible.filter((action) => action.category === 'routine'),
    5
  );
  const indoors = capSection(
    eligible.filter((action) => action.category === 'indoor'),
    4
  );
  const alternatives = capSection(
    eligible.filter((action) => action.category === 'alternative'),
    3
  );
  const sections = [routine, indoors, alternatives];
  const items = sections.flatMap((actions, sectionIndex) =>
    actions.map((action, index) =>
      toPlanItem(action, sectionIndex * 10 + index + 1, profile, snapshot, effectiveEscalation)
    )
  );
  const selected = items.map((item) => item.actionId);
  const hasSensitiveMember = getAllVulnerabilityFlags(profile).size > 0;
  return {
    headline: `Protective plan for ${effectiveBand.label}`,
    effectiveBand: effectiveBand.id,
    effectiveBandLabel: effectiveBand.label,
    escalationLevel: effectiveEscalation,
    routine: items.filter((item) => findAction(item.actionId).category === 'routine'),
    indoors: items.filter((item) => findAction(item.actionId).category === 'indoor'),
    alternatives: items.filter((item) => findAction(item.actionId).category === 'alternative'),
    candidateActionIds: selected,
    redFlagCopy: effectiveEscalation >= 4 || hasSensitiveMember ? RED_FLAG_COPY : '',
    medicalDisclaimer: MEDICAL_DISCLAIMER,
    routineWindow: findRoutineWindow(snapshot, now),
    generatedAt: now.toISOString(),
    isFallback: true,
  };
}

function capSection(actions: readonly Action[], limit: number): readonly Action[] {
  return actions.slice(0, limit);
}

function findAction(actionId: string): Action {
  const action = catalog.find((candidate) => candidate.id === actionId);
  if (!action) throw new Error(`Unknown catalog action: ${actionId}`);
  return action;
}

function toPlanItem(
  action: Action,
  priority: number,
  profile: Profile,
  snapshot: AirQualitySnapshot,
  effectiveEscalation: number
): BasicPlanItem {
  void profile;
  void effectiveEscalation;
  return {
    actionId: action.id,
    title: action.title,
    priority,
    timeOfDay: action.timeOfDay,
    optional: isOptionalPurchase(action),
    redFlag: action.redFlagTrigger,
    explanation: explainAction(action, snapshot.pm25),
  };
}

function findRoutineWindow(snapshot: AirQualitySnapshot, now: Date): string | null {
  if (!snapshot.hourlyPm25 || snapshot.hourlyPm25.length < 3) return null;
  const hourly = snapshot.hourlyPm25.map((pm25, index) => ({
    time: new Date(now.getTime() + index * 60 * 60 * 1000).toISOString(),
    pm25,
  }));
  const window = lowestPm25Window(hourly, 3);
  if (!window?.startTime) return null;
  return `${window.startTime.slice(11, 16)}–${window.endTime?.slice(11, 16) ?? 'unknown'}`;
}
