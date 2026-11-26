# TRIAGE.md

## 1 GIT

```text
$ git status --short | head -40
 M .github/workflows/ci.yml
 M scripts/evidence-ledger.json
 M scripts/evidence-pack.mjs
 M scripts/evidence-sections2.mjs

$ git log --oneline -5
68e8168 chore(deps): upgrade next and eslint-config-next to 16.4.6 + eslint 9 (0 audit advisories)
4902dd8 chore(deps): upgrade vitest and @vitest/coverage-v8 to ^5.1.2 (clears dev criticals)
8c83502 chore(deps): upgrade zod to ^4.6.7 (clears GHSA-mrhx-c7xc-m3w5)
25dd7c2 chore(deps): move msw to devDeps, target Node 24 LTS, add MSW city-scenario tests
fd39376 chore(v2-31): real knip/madge gates, single limits table, gemini-3.8-flash, legacy cleanup

$ git branch --show-current
chore/v2-31-hygiene-and-upgrades
```

## 2 BUILD

```text
$ npm run build (last 40 lines)
  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .
  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 1787ms
  Running TypeScript ...
  Finished TypeScript in 2.2s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/7) ...
  Generating static pages using 11 workers (1/7) 
  Generating static pages using 11 workers (3/7) 
  Generating static pages using 11 workers (5/7) 
✓ Generating static pages using 11 workers (7/7) in 163ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/air-quality
├ ƒ /api/ask
├ ƒ /api/audit
├ ƒ /api/bulletin
├ ƒ /api/city-scenario
├ ƒ /api/geocode
├ ƒ /api/health
├ ƒ /api/plan
├ ƒ /api/plan/narrate
├ ƒ /api/playbook
├ ƒ /api/ready
├ ƒ /ask
└ ƒ /plan


ƒ Proxy (Middleware)

ƒ  (Dynamic)  server-rendered on demand

[build] Copied .next/static to standalone folder
[build] Copied public/ to standalone folder
BUILD_EXIT_CODE=0

$ npm start (background) + GET /api/health
HEALTH_STATUS=200
```

## 3 HYDRATION AND CSP PROBE

Full output of temporary `scripts/probe.mjs` (subsequently deleted):

```json
{
  "cspHeader": "default-src 'self'; script-src 'self' 'nonce-7YgNUIZ4a/fxETDahKkhtw==' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  "consoleErrors": [],
  "pageErrors": [],
  "cspViolations": [],
  "tabAriaBefore": "false",
  "tabAriaAfter": "true",
  "tabChanged": true,
  "tabNote": "",
  "dialogVisible": true
}
```

## 4 FIRST-LOAD DATA

```text
$ curl -s "http://localhost:3000/api/city-scenario?q=delhi" (first 600 chars)
{"id":"live-delhi","city":"Delhi, National Capital Territory of Delhi","shortCity":"Delhi","subtitle":"Live observations from Open-Meteo model (03:16 pm)","sourceLabel":"Model-derived NAQI equivalent (Open-Meteo)","pm25":48,"pm10":50,"no2":14,"wind":5,"basePledges":120,"baseCo2Kg":420,"hourlyPM25":[156,153,152,151,150,141,144,160,158,133,104,79,61,52,48,47,56,80,103,122,135,143,145,143],"hourlyWind":[3,3,3,3,3,3,5,5,6,4,3,3,4,5,5,5,2,3,3,3,3,4,3,3],"isSynthetic":false}
isSynthetic=false

$ curl -s "http://localhost:3000/api/ready"
{"status":"ready","timestamp":"2026-11-26T09:46:18.994Z","llm":true}
```

First-load UI state: **Empty state** (live-data-first prompt with city search, quick-city buttons, geolocation, manual PM2.5 entry, and opt-in demo toggle; auto-fetches saved live city if `vayusaathi_last_city` is stored).

Quoted from `src/features/layout/useVayuSaathi.ts` (lines 37–56):

```ts
export function useVayuSaathi() {
  const { showToast } = useToast();
  const [scenarioKey, setScenarioKey] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationScenario | null>(null);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [lastCityQuery, setLastCityQuery] = useState<string | null>(null);
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'playbook' | 'copilot' | 'community'>('playbook');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [hotspots, setHotspots] = useState<HotspotReport[]>(INITIAL_HOTSPOTS);
  const [upvotedIds, setUpvotedIds] = useState<string[]>([]);
  const [playbookSource, setPlaybookSource] = useState('Smart Local Engine');
  const [aiPlaybook, setAiPlaybook] = useState<PlaybookData | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const loadLiveCity = useCallback(async (cityQuery: string) => {
```

## 5 FILES

### `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';

const analyzer = withBundleAnalyzer({ enabled: process.env['ANALYZE'] === 'true' });

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          // CSP is set per-request by src/middleware.ts (nonce-based).
          // Static CSP removed to avoid overriding the nonce header.
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default analyzer(nextConfig);
```

### `package.json`

```json
{
  "name": "clear-air-companion",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": "24.x"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build && node scripts/copy-assets.mjs",
    "start": "node .next/standalone/server.js",
    "lint": "eslint src tests scripts",
    "typecheck": "tsc --noEmit",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"tests/**/*.{ts,tsx}\" \"scripts/**/*.{ts,mjs}\"",
    "knip": "knip --no-progress",
    "madge": "madge --circular --extensions ts,tsx --ts-config tsconfig.json src tests scripts",
    "test": "vitest run tests/unit tests/integration",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:coverage": "vitest run --coverage tests/unit",
    "benchmark:plan": "tsx scripts/benchmark-plan.ts",
    "bench:plan": "tsx scripts/benchmark-plan.ts",
    "bench:cache": "node --expose-gc node_modules/tsx/dist/cli.mjs scripts/bench-cache.ts",
    "bench:api": "tsx scripts/bench-api.ts",
    "readability": "tsx scripts/readability.ts",
    "test:e2e": "playwright test",
    "check": "npm run format:check && npm run lint && npm run typecheck && npm run knip && npm run madge && npm run test",
    "smoke": "node scripts/smoke.mjs",
    "validate:catalog": "tsx src/catalog/validate-catalog.ts"
  },
  "dependencies": {
    "lucide-react": "^0.454.0",
    "next": "^16.4.6",
    "pino": "^10.4.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.14.0",
    "@next/bundle-analyzer": "^16.4.6",
    "@playwright/test": "^1.65.1",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^22.9.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitest/coverage-v8": "^5.1.2",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.39.5",
    "eslint-config-next": "^16.4.6",
    "jsdom": "^29.1.1",
    "knip": "^6.48.0",
    "lighthouse": "^13.6.0",
    "madge": "^8.0.0",
    "msw": "^2.15.0",
    "postcss": "^8.4.49",
    "prettier": "^3.10.1",
    "tailwindcss": "^3.4.15",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vitest": "^5.1.2"
  }
}
```

### `src/app/layout.tsx`

```tsx
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
```

### `src/app/page.tsx`

```tsx
// Satisfies: REQ-001, REQ-002, REQ-003, REQ-004, REQ-007, REQ-010, REQ-015
'use client';

import React from 'react';
import { ToastProvider, useToast } from '@/features/layout/ToastContainer';
import { useVayuSaathi } from '@/features/layout/useVayuSaathi';
import { TopHeader } from '@/features/layout/TopHeader';
import { MobileNav } from '@/features/layout/MobileNav';
import { HeroSection } from '@/features/hero/HeroSection';
import { LandingEmptyState } from '@/features/hero/LandingEmptyState';
import { DailyPlaybookTab } from '@/features/playbook/DailyPlaybookTab';
import { CopilotTab } from '@/features/copilot/CopilotTab';
import { CommunityTab } from '@/features/community/CommunityTab';
import { ProfileDrawer } from '@/features/profile/ProfileDrawer';
import { fetchLiveByCoords, buildManualScenario } from '@/features/layout/fetchLiveCity';
import { getChatFallbackReply } from '@/features/copilot/chatFallback';

function VayuSaathiApp() {
  const { showToast } = useToast();
  const state = useVayuSaathi();

  const handleFetchLiveCity = async (cityQuery: string) => {
    await state.loadLiveCity(cityQuery);
  };

  const handleUseGeolocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await fetchLiveByCoords(pos.coords.latitude, pos.coords.longitude);
          state.setLocation(loc);
          state.setPlaybookSource('Smart Local Engine');
          state.setAiPlaybook(null);
          showToast('Loaded live air quality for your approximate area.', 'success');
        } catch {
          showToast('Live Open-Meteo service unavailable. Enter AQI manually.', 'warning');
        }
      },
      () => showToast('Location permission denied. Search your city above.', 'info')
    );
  };

  const handleManualPm25 = (pm25: number) => {
    state.setLocation(buildManualScenario(pm25));
    state.setAiPlaybook(null);
    state.setPlaybookSource('Smart Local Engine');
    showToast(`Applied manual PM2.5 reading (${pm25} µg/m³).`, 'info');
  };

  const handleGenerateAI = async () => {
    if (!state.location || !state.vent || !state.impact) return;
    state.setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: state.location,
          profile: state.profile,
          vent: state.vent,
          impact: state.impact,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        state.setAiPlaybook(data.playbook);
        state.setPlaybookSource(data.source || 'Grounded VayuSaathi AI Engine');
        showToast('Fresh AI Playbook synthesized!', 'success');
      } else {
        showToast('Generated playbook from local rules engine.', 'info');
      }
    } catch {
      showToast('Generated playbook from local rules engine.', 'info');
    } finally {
      state.setIsGeneratingAI(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!state.location || !state.impact || !state.vent) return;
    state.setChatMessages((prev) => [...prev, { role: 'user', text }]);
    state.setIsChatLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          aqi: state.impact.aqi.naqi,
          pm25: state.location.pm25,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const fullAnswer = data.disclaimer ? `${data.answer}\n\n*${data.disclaimer}*` : data.answer;
        state.setChatMessages((prev) => [...prev, { role: 'assistant', text: fullAnswer }]);
      } else {
        const reply = getChatFallbackReply(text, state.location, state.impact, state.vent);
        state.setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      }
    } catch {
      const reply = getChatFallbackReply(text, state.location, state.impact, state.vent);
      state.setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      state.setIsChatLoading(false);
    }
  };

  const userCo2 = state.completedIds.length * 0.35;
  const ready = state.location && state.impact && state.vent && state.playbook;

  return (
    <div className="font-sans antialiased overflow-x-hidden pb-24 md:pb-12 bg-[#F7F6F2] min-h-screen">
      <TopHeader
        scenarioKey={state.scenarioKey}
        onScenarioChange={state.handleScenarioChange}
        activeLocation={state.location}
        profile={state.profile}
        activeTab={state.activeTab}
        onTabChange={state.setActiveTab}
        onOpenProfile={() => state.setIsProfileOpen(true)}
        onFetchLiveCity={handleFetchLiveCity}
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {state.location?.isSynthetic && (
          <div
            role="status"
            className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs font-semibold text-amber-900 flex items-center justify-between gap-2"
          >
            <span>Demo scenario (synthetic data) — not live station telemetry.</span>
            <button
              type="button"
              onClick={state.clearAllData}
              className="underline hover:text-amber-950"
            >
              Switch to live city
            </button>
          </div>
        )}

        {!ready || state.isLoadingCity ? (
          <LandingEmptyState
            isLoading={state.isLoadingCity}
            error={state.cityError}
            lastCityQuery={state.lastCityQuery}
            onFetchCity={handleFetchLiveCity}
            onUseGeolocation={handleUseGeolocation}
            onManualPm25={handleManualPm25}
            onSelectDemo={state.handleScenarioChange}
          />
        ) : (
          <>
            <HeroSection location={state.location!} impact={state.impact!} vent={state.vent!} />

            {state.activeTab === 'playbook' && (
              <DailyPlaybookTab
                playbook={state.playbook!}
                impact={state.impact!}
                completedIds={state.completedIds}
                playbookSource={state.playbookSource}
                isGeneratingAI={state.isGeneratingAI}
                onTogglePledge={state.togglePledge}
                onGenerateAI={handleGenerateAI}
              />
            )}

            {state.activeTab === 'copilot' && (
              <CopilotTab
                location={state.location!}
                profile={state.profile}
                vent={state.vent!}
                messages={state.chatMessages}
                onSendMessage={handleSendMessage}
                onResetChat={() => state.initGreeting(state.location!)}
                isLoading={state.isChatLoading}
              />
            )}

            {state.activeTab === 'community' && (
              <CommunityTab
                location={state.location!}
                profile={state.profile}
                vent={state.vent!}
                impact={state.impact!}
                completedPledgesCount={state.completedIds.length}
                userCo2Kg={userCo2}
                hotspots={state.hotspots}
                upvotedIds={state.upvotedIds}
                onAddHotspot={state.addHotspot}
                onToggleUpvote={state.toggleUpvote}
              />
            )}
          </>
        )}
      </main>

      <MobileNav activeTab={state.activeTab} onTabChange={state.setActiveTab} />

      <ProfileDrawer
        isOpen={state.isProfileOpen}
        onClose={() => state.setIsProfileOpen(false)}
        profile={state.profile}
        onSaveProfile={state.handleSaveProfile}
        onClearData={state.clearAllData}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <VayuSaathiApp />
    </ToastProvider>
  );
}
```

### `src/features/layout/useVayuSaathi.ts` (first 250 lines)

```ts
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SCENARIOS,
  DEFAULT_PROFILE,
  computeDeterministicImpact,
  type HouseholdProfile,
  type LocationScenario,
} from '@/domain/scenarios';
import { findSafeVentilationWindow } from '@/domain/naqi';
import { buildDeterministicPlaybook } from '@/domain/playbookEngine';
import { type PlaybookData } from '@/domain/playbookEngine';
import { INITIAL_HOTSPOTS, type HotspotReport } from '@/features/community/SmogPinboard';
import type { ChatMessage } from '@/features/copilot/CopilotChat';
import { fetchLiveIndianCity } from './fetchLiveCity';
import { useToast } from './ToastContainer';

const STORAGE = {
  profile: 'vayusaathi_profile_v1',
  pledges: 'vayusaathi_pledges_v1',
  hotspots: 'vayusaathi_hotspots_v1',
  upvotes: 'vayusaathi_upvotes_v1',
  lastCity: 'vayusaathi_last_city',
};

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useVayuSaathi() {
  const { showToast } = useToast();
  const [scenarioKey, setScenarioKey] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationScenario | null>(null);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [lastCityQuery, setLastCityQuery] = useState<string | null>(null);
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'playbook' | 'copilot' | 'community'>('playbook');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [hotspots, setHotspots] = useState<HotspotReport[]>(INITIAL_HOTSPOTS);
  const [upvotedIds, setUpvotedIds] = useState<string[]>([]);
  const [playbookSource, setPlaybookSource] = useState('Smart Local Engine');
  const [aiPlaybook, setAiPlaybook] = useState<PlaybookData | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const loadLiveCity = useCallback(async (cityQuery: string) => {
    setIsLoadingCity(true);
    setCityError(null);
    setLastCityQuery(cityQuery);
    try {
      const newLoc = await fetchLiveIndianCity(cityQuery);
      if (!newLoc) {
        setCityError(`Could not find "${cityQuery}". Try Delhi, Lucknow, or Patna.`);
        return;
      }
      setSelectedLocation(newLoc);
      setScenarioKey('');
      setAiPlaybook(null);
      setPlaybookSource('Smart Local Engine');
      try {
        localStorage.setItem(STORAGE.lastCity, cityQuery);
      } catch {
        // ignore
      }
    } catch {
      setCityError('Live air quality provider unavailable. Retry or enter AQI manually.');
    } finally {
      setIsLoadingCity(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setProfile(loadStorage(STORAGE.profile, DEFAULT_PROFILE));
      setCompletedIds(loadStorage(STORAGE.pledges, []));
      setHotspots(loadStorage(STORAGE.hotspots, INITIAL_HOTSPOTS));
      setUpvotedIds(loadStorage(STORAGE.upvotes, []));
      try {
        const savedCity = localStorage.getItem(STORAGE.lastCity);
        if (savedCity && savedCity.trim().length >= 2) {
          void loadLiveCity(savedCity);
        }
      } catch {
        // ignore
      }
    });
  }, [loadLiveCity]);

  const vent = useMemo(
    () =>
      selectedLocation
        ? findSafeVentilationWindow(selectedLocation.hourlyPM25, selectedLocation.hourlyWind)
        : null,
    [selectedLocation]
  );
  const impact = useMemo(
    () => (selectedLocation ? computeDeterministicImpact(selectedLocation, profile) : null),
    [selectedLocation, profile]
  );
  const playbook = useMemo(() => {
    if (!selectedLocation || !vent || !impact) return null;
    return aiPlaybook || buildDeterministicPlaybook(selectedLocation, profile, vent, impact);
  }, [aiPlaybook, selectedLocation, profile, vent, impact]);

  const initGreeting = useCallback((loc: LocationScenario) => {
    const { naqi, band } = computeDeterministicImpact(loc, DEFAULT_PROFILE).aqi;
    const v = findSafeVentilationWindow(loc.hourlyPM25, loc.hourlyWind);
    setChatMessages([
      {
        role: 'assistant',
        text: `Namaste! I'm **VayuSaathi**. Right now **${loc.city}** is at **CPCB NAQI ${naqi} (${band.label})** with PM2.5 at ${loc.pm25} µg/m³.\n\nYour safest cross-ventilation slot today is **${v.windowLabel}**. Ask me anything in English, Hindi, or Hinglish!`,
      },
    ]);
  }, []);

  const defaultMessages = useMemo<ChatMessage[]>(() => {
    if (!selectedLocation) return [];
    const { naqi, band } = computeDeterministicImpact(selectedLocation, DEFAULT_PROFILE).aqi;
    const v = findSafeVentilationWindow(selectedLocation.hourlyPM25, selectedLocation.hourlyWind);
    return [
      {
        role: 'assistant',
        text: `Namaste! I'm **VayuSaathi**. Right now **${selectedLocation.city}** is at **CPCB NAQI ${naqi} (${band.label})** with PM2.5 at ${selectedLocation.pm25} µg/m³.\n\nYour safest cross-ventilation slot today is **${v.windowLabel}**. Ask me anything in English, Hindi, or Hinglish!`,
      },
    ];
  }, [selectedLocation]);

  const handleScenarioChange = (key: string) => {
    const clean = key.replace(/^demo:/, '');
    if (SCENARIOS[clean]) {
      setScenarioKey(`demo:${clean}`);
      setSelectedLocation({ ...SCENARIOS[clean] });
      setCityError(null);
      setAiPlaybook(null);
      setChatMessages([]);
      setPlaybookSource('Smart Local Engine');
      showToast(`Loaded demo scenario: ${SCENARIOS[clean].city} (synthetic data).`, 'info');
    }
  };
```

*(Truncated at 150 lines of `useVayuSaathi.ts` per triage cap.)*

### `src/components/shared/ServiceWorker.tsx`

```tsx
// Satisfies: REQ-010 — registers SW only in production; accepts nonce prop
// for the layout to pass through. Cleans up stale workers on mount.
'use client';

import { useEffect } from 'react';

interface ServiceWorkerProps {
  nonce?: string;
}

export function ServiceWorker({ nonce: _nonce }: ServiceWorkerProps) {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;

    // Unregister any worker using an old cache name before registering new one
    navigator.serviceWorker.getRegistrations().then((regs) => {
      const stale = regs.filter((r) => r.active?.scriptURL.includes('/sw.js'));
      Promise.all(stale.map((r) => r.unregister())).then(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      });
    });
  }, []);
  return null;
}
```

### `public/sw.js`

```javascript
// Network-first SW: HTML/JS serve from network, fallback to cache.
// Cache name is versioned; old caches are deleted on activate.
// Satisfies: REQ-010 (offline fallback), V2-30 step 4

const CACHE_VERSION = 'vs-v3';
const CACHE_NAME = `vayusaathi-${CACHE_VERSION}`;
const SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET or API requests
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  // Network-first: try network, fall back to cache, then shell
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Only cache successful same-origin responses
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match('/'))
      )
  );
});
```

### `src/server/api/cityScenario.ts` (first 150 lines)

```ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { LocationScenario } from '@/domain/scenarios';
import { searchOpenMeteo } from '@/server/providers/geocoding';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { boundaryError, MAX_QUERY_LENGTH, RATE_LIMITS } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';
import { LruCache } from '@/server/cache/lru';

const limiter = new TokenBucketLimiter(
  RATE_LIMITS.cityScenarioPerMinute,
  60_000,
  new MemoryBucketStore()
);
const scenarioCache = new LruCache<string, LocationScenario>({
  maxEntries: 100,
  ttlMs: 15 * 60 * 1000,
});
const QuerySchema = z.object({ q: z.string().trim().min(2).max(MAX_QUERY_LENGTH) });

interface MeteoPayload {
  aq: {
    current: { pm10: number; pm2_5: number; nitrogen_dioxide?: number };
    hourly?: { pm2_5?: (number | null)[] };
  };
  wx: {
    current: { wind_speed_10m: number; temperature_2m?: number };
    hourly?: { wind_speed_10m?: (number | null)[] };
  };
}

async function fetchLiveMeteo(lat: number, lon: number): Promise<MeteoPayload | null> {
  try {
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,nitrogen_dioxide&hourly=pm10,pm2_5,nitrogen_dioxide&timezone=auto&forecast_days=2`;
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,temperature_2m&hourly=wind_speed_10m&timezone=auto&forecast_days=2`;
    const [aqRes, wxRes] = await Promise.all([
      fetch(aqUrl, { signal: AbortSignal.timeout(3500) }),
      fetch(wxUrl, { signal: AbortSignal.timeout(3500) }),
    ]);
    if (!aqRes.ok || !wxRes.ok) return null;
    const aq = await aqRes.json();
    const wx = await wxRes.json();
    if (
      !aq?.current ||
      !Number.isFinite(aq.current.pm2_5) ||
      !Number.isFinite(aq.current.pm10) ||
      !wx?.current ||
      !Number.isFinite(wx.current.wind_speed_10m)
    ) {
      return null;
    }
    return { aq, wx };
  } catch {
    return null;
  }
}

function extractHourlySeries(raw: (number | null)[] | undefined, fallback: number): number[] {
  const series = (raw || []).slice(0, 24).map((v) => Math.max(1, Math.round(v ?? fallback)));
  while (series.length < 24) series.push(fallback);
  return series;
}

function buildScenarioFromData(
  city: string,
  admin1: string | undefined,
  data: MeteoPayload
): LocationScenario {
  const pm25 = Math.round(data.aq.current.pm2_5);
  const pm10 = Math.round(data.aq.current.pm10);
  const no2 = Math.round(data.aq.current.nitrogen_dioxide ?? 0);
  const wind = Math.max(1, Math.round(data.wx.current.wind_speed_10m));
  const hourlyPM25 = extractHourlySeries(data.aq.hourly?.pm2_5, pm25);
  const hourlyWind = extractHourlySeries(data.wx.hourly?.wind_speed_10m, wind);

  return {
    id: `live-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    city: `${city}, ${admin1 || 'India'}`,
    shortCity: city,
    subtitle: `Live observations from Open-Meteo model (${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})`,
    sourceLabel: 'Model-derived NAQI equivalent (Open-Meteo)',
    pm25,
    pm10,
    no2,
    wind,
    basePledges: 120,
    baseCo2Kg: 420,
    hourlyPM25,
    hourlyWind,
    isSynthetic: false,
  };
}
```

### `src/app/api/city-scenario/route.ts`

```ts
import { NextRequest } from 'next/server';
import { handleCityScenario } from '@/server/api/cityScenario';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleCityScenario(req);
}
```

### `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
```

## 6 ROUTES AND ENV NAMES

API routes under `src/app/api`:
- `src/app/api/air-quality/route.ts`
- `src/app/api/ask/route.ts`
- `src/app/api/audit/route.ts`
- `src/app/api/bulletin/route.ts`
- `src/app/api/city-scenario/route.ts`
- `src/app/api/geocode/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/plan/route.ts`
- `src/app/api/plan/narrate/route.ts`
- `src/app/api/playbook/route.ts`
- `src/app/api/ready/route.ts`

Environment variable NAMES in `.env.example`:
`GEMINI_API_KEY`, `GEMINI_MODEL`, `LLM_ENABLED`, `LLM_DAILY_CALL_CAP`, `AQ_PROVIDER`, `RATE_LIMIT_PLAN`, `RATE_LIMIT_AQI`, `RATE_LIMIT_GEOCODE`, `RATE_LIMIT_FOLLOWUP`, `TRUSTED_PROXY_HEADER`, `CLIENT_IP_SALT`, `LOG_LEVEL`, `APP_ORIGIN`, `NODE_ENV`

Present in environment:
- `GEMINI_API_KEY`: yes
- `GEMINI_MODEL`: yes

## 7 YOUR DIAGNOSIS

- **Hydration / UI interactivity:** `VERIFIED` — both tab switching (`aria-selected`: `"false"` -> `"true"`) and Profile drawer (`role="dialog"` visible) now work with zero console errors, zero `pageerror`, and zero `securitypolicyviolation` events because `src/middleware.ts` emits a per-request CSP nonce (`script-src 'self' 'nonce-...' 'strict-dynamic'`).
- **First-load data:** `VERIFIED` — no longer shows synthetic demo data; `useVayuSaathi.ts` initializes `selectedLocation` to `null` (rendering `LandingEmptyState`), and `GET /api/city-scenario?q=delhi` geocodes live (`isSynthetic: false`).
- **Remaining caveats:** `VERIFIED` — (1) `.env.example` still lists unused `RATE_LIMIT_FOLLOWUP` after `/api/followup` was removed; (2) `scripts/probe.mjs` probe ran against `main`/`chore/v2-31` current HEAD where `src/middleware.ts` triggers Next 16's deprecation warning (`middleware` -> `proxy`) and React 18 triggers Next 16 deprecation warning; (3) four V2-31 files (`ci.yml`, `evidence-ledger.json`, `evidence-pack.mjs`, `evidence-sections2.mjs`) remain uncommitted in working tree per "Do NOT modify any source file" triage constraint.
