'use client';

import React from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center" role="alert">
      <h1 tabIndex={-1}>Something went wrong</h1>
      <p className="mt-3">
        The page could not finish loading. Your saved profile and plan may still be available.
      </p>
      <button type="button" onClick={reset} className="mt-4 rounded bg-blue-700 px-4 text-white">
        Try again
      </button>
    </main>
  );
}
