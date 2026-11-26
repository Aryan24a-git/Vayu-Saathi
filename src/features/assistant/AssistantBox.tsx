'use client';

import React, { useEffect, useState } from 'react';
import { useAsk } from './useAsk';

const suggested = [
  'How should I ventilate indoors?',
  'When should I wear an N95?',
  'What is a low-cost indoor protection step?',
];

export function AssistantBox({
  initialQuestion = '',
  initialConsentEnabled = true,
}: {
  initialQuestion?: string;
  initialConsentEnabled?: boolean;
}) {
  const [consent, setConsent] = useState(initialConsentEnabled);
  const [question, setQuestion] = useState(initialQuestion);
  const { state, answer, disclaimer, ask } = useAsk(consent);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cac_ai_consent_v1');
      if (stored === 'false') setConsent(false);
      if (stored === 'true') setConsent(true);
    } catch {
      setConsent(false);
    }
  }, []);
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
        <label htmlFor="assistant-question" className="block text-sm">
          Question
        </label>
        <textarea
          id="assistant-question"
          minLength={3}
          maxLength={300}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="mt-1 min-h-24 w-full rounded border p-3"
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span aria-live="polite">{question.length}/300 characters</span>
          <button
            type="submit"
            disabled={question.trim().length < 3}
            className="min-h-11 rounded bg-blue-700 px-4 text-white"
          >
            Ask
          </button>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggested.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => setQuestion(text)}
            className="rounded-full border px-3 py-2 text-sm"
          >
            {text}
          </button>
        ))}
      </div>
      {state === 'loading' && (
        <p role="status" aria-live="polite" className="mt-3 text-sm">
          Asking the assistant…
        </p>
      )}
      {answer && (
        <div className="mt-3 rounded bg-slate-50 p-3 text-sm">
          <p>{answer}</p>
          {disclaimer && <p className="mt-2 text-slate-600">{disclaimer}</p>}
        </div>
      )}
    </section>
  );
}
