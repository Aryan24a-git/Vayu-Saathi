// Satisfies: REQ-011, SEC-004, D6
// Prompt injection defenses and bounded scope checks.

import { z } from 'zod';

const INJECTION_PATTERNS = [
  /ignore previous/i,
  /ignore all prior/i,
  /system prompt/i,
  /you are now/i,
  /jailbreak/i,
  /<script/i,
  /javascript:/i,
  /bypass/i,
];

/** Check if text contains high-risk prompt injection cues */
export function containsPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Sanitize user text by trimming and limiting length */
export function sanitizeInput(text: string, maxLength = 250): string {
  return text.trim().slice(0, maxLength);
}

/** Bounded scope validator: ensure questions pertain to air quality */
export function isAirQualityRelated(text: string): boolean {
  const keywords = [
    'air', 'smog', 'aqi', 'pm2.5', 'pm10', 'pollution', 'mask', 'n95',
    'filter', 'purifier', 'smoke', 'breathe', 'lungs', 'cough', 'ventilation',
    'window', 'indoor', 'outdoor', 'clean', 'haze', 'dust', 'asthma'
  ];
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export const PlanOutputSchema = z.object({
  narrative: z.string().max(1000),
  selectedActionIds: z.array(z.string().regex(/^ACT-\d{3}$/)).min(1).max(10),
  keyAdvice: z.string().max(300),
});

export type PlanOutput = z.infer<typeof PlanOutputSchema>;
