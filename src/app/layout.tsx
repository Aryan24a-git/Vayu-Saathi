// Satisfies: A11Y-001, EC-006, REQ-003 — hydration canary + nonce support
// dynamic = 'force-dynamic' so headers() reads the nonce per request
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { ServiceWorker } from '@/components/shared/ServiceWorker';
import { HydrationCanary } from '@/components/shared/HydrationCanary';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Clear Air Companion – Winter Smog Guide',
  description: 'Personalized, grounded guidance for households navigating severe winter smog.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const nonce = headerStore.get('x-nonce') ?? '';

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <HydrationCanary />
        <ServiceWorker nonce={nonce} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-blue-600 focus:text-white"
        >
          Skip to main content
        </a>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-5xl mx-auto px-4 space-y-1">
            <p>Clear Air Companion · Built for winter smog resilience</p>
            <p>
              Informational only. Not medical advice. Coordinates rounded to 2 decimals for privacy.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
