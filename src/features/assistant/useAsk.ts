'use client';

import { useState } from 'react';

export type AskState = 'idle' | 'loading' | 'answer' | 'refused' | 'rate_limited' | 'error';

export function useAsk(consentEnabled: boolean) {
  const [state, setState] = useState<AskState>('idle');
  const [answer, setAnswer] = useState('');
  const [disclaimer, setDisclaimer] = useState('');

  const ask = async (question: string) => {
    if (!consentEnabled) {
      setState('answer');
      setAnswer(
        'AI chat is off. Static catalog guidance: keep windows closed during peak smog, seal indoor gaps, and avoid burning waste.'
      );
      setDisclaimer('Informational only. Not medical advice.');
      return;
    }
    setState('loading');
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (response.status === 429) {
        setState('rate_limited');
        setAnswer('Too many questions were sent. Please wait before asking again.');
        return;
      }
      if (!response.ok) {
        setState('error');
        setAnswer('The assistant is unavailable. You can still use the selected plan below.');
        return;
      }
      const data: unknown = await response.json();
      if (typeof data !== 'object' || data === null) throw new Error('Invalid response');
      const record = data as Record<string, unknown>;
      setAnswer(
        typeof record['answer'] === 'string' ? record['answer'] : 'No answer was available.'
      );
      setDisclaimer(
        typeof record['disclaimer'] === 'string' ? record['disclaimer'] : 'Informational only.'
      );
      setState(record['fallback'] === true ? 'refused' : 'answer');
    } catch {
      setState('error');
      setAnswer('The assistant is unavailable. Static FAQ guidance remains available.');
    }
  };
  return { state, answer, disclaimer, ask };
}
