import type { NormalizedPlan } from '../plan/usePlan';
import type { AqiReading } from '@/domain/aqi-bands';

export function planToText(plan: NormalizedPlan, reading: AqiReading): string {
  const items = [...plan.routine, ...plan.indoors, ...plan.alternatives];
  const lines = [
    plan.headline,
    `Air quality: ${reading.aqi} AQI · Source: ${reading.source}`,
    `Observed: ${reading.timestamp}`,
    '',
  ];
  for (const item of items) {
    lines.push(`- ${item.action.title}: ${item.action.shortDescription}`);
  }
  lines.push('', plan.medicalDisclaimerText ?? 'Informational only. Not medical advice.');
  return lines.join('\n');
}
