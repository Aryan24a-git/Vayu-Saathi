// Satisfies: REQ-009, SEC-002, REL-001
// Server-only Gemini client with timeout and error handling.

import { logger } from '../logger';

interface GeminiMessage {
  text: string;
}

export async function generateContent(
  systemInstruction: string,
  prompt: string
): Promise<string | null> {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey || apiKey.trim().length === 0) {
    logger.info('No GEMINI_API_KEY configured, will use deterministic fallback');
    return null;
  }

  const model = process.env['GEMINI_MODEL'] || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      logger.warn('Gemini API call failed', { status: res.status });
      return null;
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof candidateText === 'string' ? candidateText : null;
  } catch (err) {
    logger.warn('Gemini request exception, falling back', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
