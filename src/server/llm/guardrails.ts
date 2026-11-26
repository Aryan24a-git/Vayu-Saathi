import { NarrativeSchema, type NarrativeOutput } from './schema';

const MEDICAL_PHRASES = [
  'take this medicine',
  'take aspirin',
  'prescribe',
  'diagnose',
  'you have asthma',
  'your asthma',
  'dosage',
];

const INJECTION_PATTERNS = [
  /ignore (?:all )?(?:previous|prior)/i,
  /system prompt/i,
  /role[- ]play/i,
  /exfiltrat/i,
  /<script/i,
  /javascript:/i,
  /!\[[^\]]*\]\([^)]*\)/i,
  /\[[^\]]+\]\(https?:\/\//i,
];

export interface GroundingInput {
  selectedIds: readonly string[];
  impacts: ReadonlyMap<string, readonly string[]>;
}

export type GuardrailResult = { ok: true; value: NarrativeOutput } | { ok: false; reason: string };

export function validateNarrative(raw: unknown, grounding: GroundingInput): GuardrailResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'invalid_json' };
  }
  const parsed = NarrativeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'schema_mismatch' };
  const text = JSON.stringify(parsed.data).toLowerCase();
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return { ok: false, reason: 'unsafe_content' };
  }
  if (MEDICAL_PHRASES.some((phrase) => text.includes(phrase))) {
    return { ok: false, reason: 'medical_advice' };
  }
  if (/https?:\/\/|www\.|<[^>]+>/.test(text)) {
    return { ok: false, reason: 'links_or_markup' };
  }
  const ids = parsed.data.itemNotes.map((item) => item.id);
  if (ids.length !== new Set(ids).size) {
    return { ok: false, reason: 'duplicate_action_id' };
  }
  if (ids.some((id) => !grounding.selectedIds.includes(id))) {
    return { ok: false, reason: 'unknown_or_unselected_action' };
  }
  if (!hasOnlySuppliedNumbers(text, grounding.impacts)) {
    return { ok: false, reason: 'unsupported_number' };
  }
  return { ok: true, value: parsed.data };
}

function hasOnlySuppliedNumbers(
  text: string,
  impacts: ReadonlyMap<string, readonly string[]>
): boolean {
  const allowed = new Set<string>();
  for (const values of impacts.values()) {
    for (const value of values) allowed.add(value);
  }
  const textWithoutIds = text.replace(/act-\d{3}/gi, '');
  const numbers = textWithoutIds.match(/(?<![A-Za-z0-9])\d+(?:\.\d+)?(?![A-Za-z0-9])/g) ?? [];
  return numbers.every((number) => allowed.has(number));
}

export function classifyQuestionScope(question: string): 'air' | 'indoor' | 'living' | 'off_topic' {
  const lower = question.toLowerCase();
  if (containsInjection(lower) || /diagnos|prescrib|medicine|dosage|treat my/i.test(lower)) {
    return 'off_topic';
  }
  if (/purifier|ventilat|window|indoor|humidity|cooking|co2/.test(lower)) return 'indoor';
  if (/aqi|pm2\.?5|smog|pollution|mask|n95|outdoor|breath/.test(lower)) return 'air';
  if (/commute|transport|bus|metro|bicycle|wfh|fuel|heating|waste|shopping/.test(lower)) {
    return 'living';
  }
  return 'off_topic';
}

export function containsInjection(text: string): boolean {
  return (
    INJECTION_PATTERNS.some((pattern) => pattern.test(text)) ||
    /ignore previous|exfiltrate|system prompt|reveal instructions/i.test(text)
  );
}
