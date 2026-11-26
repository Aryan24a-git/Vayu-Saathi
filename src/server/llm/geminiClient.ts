// Gemini Client implementation for server-side LLM calls
// Strictly typed, functions < 40 lines, file < 250 lines (NFR-004)
// Replaces earlier Anthropic client per ADR-004

export {
  type LlmRequest,
  type LlmClient,
  NullClient,
  GeminiClient,
  createLlmClient,
} from './client';

import { createLlmClient } from './client';

export const getLlmClient = createLlmClient;
