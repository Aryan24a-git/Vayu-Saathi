import type { Profile } from '../../domain/profile';
import type { BasicPlan } from '../../domain/plan';
import { createLlmClient, stripMarkdownCodeFences, type LlmClient } from './client';
import { classifyQuestionScope, containsInjection } from './guardrails';
import { QUESTION_SYSTEM_PROMPT } from './prompts';
import { AnswerSchema } from './schema';
import { logger } from '../../lib/logger';

const TEMPLATES = {
  off_topic:
    'I can only help with air quality, indoor air, or low-emission living. I cannot diagnose or prescribe treatment.',
  air: 'Keep outdoor exposure low during high pollution, follow the selected plan, and seek urgent care for severe breathing symptoms.',
  indoor:
    'Keep indoor air clean by sealing during peak smog and ventilating only when outdoor air is cleaner.',
  living:
    'Choose low-emission options that fit your budget and housing, and avoid burning waste or biomass indoors.',
};

export interface AskResult {
  answer: string;
  disclaimer: string;
  fallback: boolean;
  source: 'ai' | 'basic';
  fallbackReason?: string;
}

export async function ask(
  question: string,
  profile: Profile,
  plan: BasicPlan,
  client: LlmClient = createLlmClient()
): Promise<AskResult> {
  const scope = classifyQuestionScope(question);
  if (scope === 'off_topic' || containsInjection(question)) {
    logger.warn('llmScopeRefusal', { fallbackReason: 'off_topic_or_injection' });
    return refusal('off_topic_or_injection');
  }
  if (question.trim().length > 300) return refusal('question_too_long');
  const prompt = JSON.stringify({
    scope,
    band: plan.effectiveBand,
    selectedActionIds: plan.candidateActionIds,
    question,
  });
  const raw = await client.complete({
    system: QUESTION_SYSTEM_PROMPT,
    prompt: `<user_data>${prompt}</user_data>`,
    maxTokens: 300,
    timeoutMs: 12_000,
    jsonMode: true,
  });
  void profile;
  if (!raw) return template(scope);
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownCodeFences(raw));
  } catch {
    return template(scope);
  }
  const result = AnswerSchema.safeParse(parsed);
  if (
    !result.success ||
    /\d/.test(result.data.answer) ||
    /https?:\/\/|www\.|<[^>]+>/.test(result.data.answer)
  ) {
    logger.warn('llmFallback', { fallbackReason: 'answer_guardrail' });
    return template(scope);
  }
  return {
    answer: result.data.answer,
    disclaimer: 'Informational only. Not medical advice.',
    fallback: false,
    source: 'ai',
  };
}

function refusal(reason: string): AskResult {
  return {
    answer: TEMPLATES.off_topic,
    disclaimer: 'Informational only. Not medical advice.',
    fallback: true,
    source: 'basic',
    fallbackReason: reason,
  };
}

function template(
  scope: Exclude<ReturnType<typeof classifyQuestionScope>, 'off_topic'>
): AskResult {
  return {
    answer: TEMPLATES[scope],
    disclaimer: 'Informational only. Not medical advice.',
    fallback: true,
    source: 'basic',
    fallbackReason: 'llm_unavailable_or_guardrail',
  };
}
