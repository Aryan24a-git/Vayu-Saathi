'use client';

import React, { useState } from 'react';
import { useAsk } from './useAsk';

const suggested = [
  'How should I ventilate indoors?',
  'When should I wear an N95?',
  'What is a low-cost indoor protection step?',
];

function readStoredConsent(fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem('cac_ai_consent_v1');
    if (stored === 'false') return false;
    if (stored === 'true') return true;
    return fallback;
  } catch {
    return false;
  }
}

export function AssistantBox({
  initialQuestion = '',
  initialConsentEnabled = true,
}: {
  initialQuestion?: string;
  initialConsentEnabled?: boolean;
}) {
  const [consent, setConsent] = useState(() => readStoredConsent(initialConsentEnabled));
  const [question, setQuestion] = useState(initialQuestion);
  const { state, answer, disclaimer, ask } = useAsk(consent);
  const updateConsent = (enabled: boolean) => {
    setConsent(enabled);
    try {
      localStorage.setItem('cac_ai_consent_v1', String(enabled));
    } catch {
      // Static fallback remains usable without storage.
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (question.trim().length >= 3) void ask(question.trim());
  };
  return (
    <section
      aria-labelledby="assistant-heading"
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <h2 id="assistant-heading" className="font-bold">
        Air-quality assistant
      </h2>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => updateConsent(event.target.checked)}
        />
        Allow AI assistance
      </label>
      {!consent && (
        <p className="mt-2 text-sm">
          Static catalog guidance: keep windows closed during peak smog, seal indoor gaps, and avoid
          burning waste.
        </p>
      )}
      <form onSubmit={submit} className="mt-3">
        <label htmlFor="ask-question" className="block text-sm font-medium">
          Question
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="ask-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Ask about indoor air or precautions"
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Ask
          </button>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggested.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuestion(item);
              void ask(item);
            }}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs"
          >
            {item}
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" className="mt-4 text-sm">
        {state === 'loading' && <p>Checking guidance…</p>}
        {answer && (
          <p className="rounded-lg bg-slate-50 p-3">
            {answer} <span className="block text-xs text-slate-600">{disclaimer}</span>
          </p>
        )}
      </div>
    </section>
  );
}
