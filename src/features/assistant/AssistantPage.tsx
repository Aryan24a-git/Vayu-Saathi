'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { AssistantBox } from './AssistantBox';

export function AssistantPage({ consentEnabled = true }: { consentEnabled?: boolean }) {
  useEffect(() => {
    document.querySelector<HTMLElement>('h1')?.focus();
  }, []);
  return (
    <div className="flex-1">
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-6">
        <h1 tabIndex={-1} className="text-2xl font-bold">
          Ask about air quality
        </h1>
        <div className="mt-4">
          <AssistantBox initialConsentEnabled={consentEnabled} />
        </div>
      </main>
    </div>
  );
}
