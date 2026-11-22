# MEMORY.md — Clear Air Companion Project State

> Version: 1.0.0 | Updated: 2026-11-22
> Protocol: P1–P14

---

## 1. Project Overview & Current State
- **Current Phase**: Phase 2 — V2 Prompt Execution
- **Task State**: VERIFIED
- **Working Title**: Clear Air Companion
- **Repository**: `e:\projects\Challenge 6`
- **Architecture**: Modular Monolith on Next.js 14 App Router + TypeScript + Tailwind CSS

---

## 2. Verified Repository State (Inspection & Execution)
- **10 Foundation Documents**:
  - `AGENTS.md` (14-step contract, degradation matrix, module map) — VERIFIED
  - `README.md` (Quick-start, architecture, personas, data sources) — VERIFIED
  - `.env.example` (12-factor env template) — VERIFIED
  - `docs/ACCESSIBILITY.md` (WCAG 2.1 AA checklist, design tokens) — VERIFIED
  - `docs/ARCHITECTURE.md` (Modular monolith, caching, security architecture) — VERIFIED
  - `docs/DOMAIN.md` (Rules D1–D6, AQI band table, vulnerability flags) — VERIFIED
  - `docs/REQUIREMENTS.md` (Full functional, security, A11Y, perf registry) — VERIFIED
  - `docs/SECURITY.md` (Threat model, SSRF allowlists, prompt-injection defenses) — VERIFIED
  - `docs/TESTING.md` (Test stack, coverage targets, fixture structures) — VERIFIED
  - `docs/TRACEABILITY.md` (EC → REQ → implementation file mapping) — VERIFIED

- **Action Catalog & Guard**:
  - `src/catalog/catalog.json` (28 curated winter smog actions with sourced impact) — VERIFIED
  - `src/catalog/catalog.schema.ts` (Zod schema enforcing impact ranges & confidence) — VERIFIED
  - `src/catalog/validate-catalog.ts` (Build-time validation script; passes with 0 errors) — VERIFIED

- **Domain Core (Pure Functions, Zero I/O)**:
  - `src/domain/aqi-bands.ts` (US AQI & PM2.5 band classification, early escalation) — VERIFIED (100% line coverage)
  - `src/domain/profile.ts` (Household profile schema, vulnerability flags, migrations) — VERIFIED (100% line coverage)
  - `src/domain/rules-engine.ts` (Candidate action filtering, budget/feasibility filter) — VERIFIED (100% line coverage)
  - `src/domain/impact-model.ts` (Exposure vs emissions range calculations, confidence) — VERIFIED (97.1% line coverage)
  - `src/domain/community-calc.ts` (What-if community collective impact model) — VERIFIED (95.2% line coverage)

- **Infrastructure & Providers**:
  - `src/lib/config.ts` (12-factor env boot validation) — VERIFIED
  - `src/lib/logger.ts` (Structured JSON logger with automatic redaction) — VERIFIED
  - `src/lib/cache.ts` (LRU cache with TTL + in-flight request coalescer) — VERIFIED
  - `src/lib/rate-limit.ts` (Per-client IP rate limiter) — VERIFIED
  - `src/lib/providers/aqi.ts` (Open-Meteo AQI adapter + cache + coordinate rounding) — VERIFIED
  - `src/lib/providers/geocoding.ts` (Open-Meteo Geocoding adapter + cache) — VERIFIED
  - `src/lib/ai/client.ts` (Gemini API client with timeout & safe fallback) — VERIFIED
  - `src/lib/ai/guardrails.ts` (Adversarial injection detection & scope bounds) — VERIFIED
  - `src/lib/ai/planner.ts` (Catalog-grounded narrative generator & fallback) — VERIFIED
  - `src/i18n/en.json` (Externalized plain language copy) — VERIFIED

- **API Routes (Next.js App Router)**:
  - `src/app/api/aqi/route.ts` (GET /api/aqi with rate limit & Zod validation) — VERIFIED
  - `src/app/api/geocode/route.ts` (GET /api/geocode with rate limit) — VERIFIED
  - `src/app/api/plan/route.ts` (POST /api/plan with profile validation) — VERIFIED
  - `src/app/api/followup/route.ts` (POST /api/followup with injection guard) — VERIFIED
  - `src/app/api/health/route.ts` (GET /api/health) — VERIFIED

- **Accessible UI Components (WCAG 2.1 AA)**:
  - `src/components/shared/Header.tsx` — VERIFIED
  - `src/components/aqi/AqiBadge.tsx` (Non-color AQI: icon + label + numeric AQI + PM2.5) — VERIFIED
  - `src/components/profile/ProfileWizard.tsx` (6-step profile questionnaire, localStorage) — VERIFIED
  - `src/components/plan/PlanCard.tsx` (Routine, hacks, alternatives, impact ranges, red flags) — VERIFIED
  - `src/components/community/CommunityCalculator.tsx` (Collective what-if projections) — VERIFIED
  - `src/components/plan/FollowUpChat.tsx` (Scoped Q&A chat) — VERIFIED
  - `src/app/layout.tsx` (Semantic HTML, skip to content link) — VERIFIED
  - `src/app/page.tsx` (Responsive unified dashboard) — VERIFIED

---

## 3. Test & Build Execution Evidence
- **Catalog Validation**: `npm run validate:catalog` -> 28 actions valid, 0 errors (VERIFIED)
- **Unit Test Suite**: `npm test` -> 6 test files, 21 tests passed, 0 failures (VERIFIED)
- **Domain Line Coverage**: `npm run test:coverage` -> **99.08% lines** across `src/domain/` (VERIFIED)
- **Production Build**: `npm run build` -> Compiled successfully, First Load JS: **118 kB** (well under 150 kB limit) (VERIFIED)
- **Static Constraints**: All files $\le 159$ lines (under 250 limit), all functions $\le 40$ lines (VERIFIED)
- **Git State**: Initialized repository, initial commit created (VERIFIED)

---

## 4. Requirement Verification Status
- `REQ-001` (Location via geocoding/GPS/manual): VERIFIED
- `REQ-002` (Household profile schema): VERIFIED
- `REQ-003` (Current AQI + PM2.5): VERIFIED
- `REQ-004` (Daily routine by time-of-day): VERIFIED
- `REQ-005` (Indoor air quality hacks): VERIFIED
- `REQ-006` (Sustainable alternatives): VERIFIED
- `REQ-007` (Impact range + basis + confidence): VERIFIED
- `REQ-008` (Sensitive group guidance + red flags): VERIFIED
- `REQ-009` (Catalog-grounded LLM narrative): VERIFIED
- `REQ-010` (Deterministic fallback): VERIFIED
- `REQ-011` (Bounded air quality Q&A): VERIFIED
- `REQ-012` (Share & print plan): VERIFIED
- `REQ-013` (Plain language & i18n copy): VERIFIED
- `REQ-015` (Profile CRUD in localStorage): VERIFIED
- `REQ-016` (Community what-if calculator): VERIFIED
- `NFR-001` (Modular monolith, no DB): VERIFIED
- `NFR-004` (Strict TS, files < 250 lines): VERIFIED
- `SEC-001` (Zod validation on all requests): VERIFIED
- `SEC-002` (Server-only secrets): VERIFIED
- `SEC-003` (Rate limiting on all routes): VERIFIED
- `SEC-004` (Prompt-injection defenses): VERIFIED
- `SEC-006` (SSRF guard on providers): VERIFIED
- `SEC-007` (No raw HTML rendering): VERIFIED
- `SEC-009` (Redacted logs): VERIFIED
- `A11Y-001` (Semantic HTML, skip link): VERIFIED
- `A11Y-002` (AQI not conveyed by color alone): VERIFIED
- `PERF-001` (First load JS $\le 150$ kB): VERIFIED (118 kB)
- `PERF-002` (AQI cache with TTL & coalescing): VERIFIED
- `TEST-001` (Domain coverage $\ge 90\%$): VERIFIED (99.08%)
- `DATA-001` (No server persistence, coords 2dp): VERIFIED
- `DATA-004` (Sourced impact figures only): VERIFIED

---

## 5. Next Action
Ready to receive prompt `V2-00` or subsequent prompt according to the V2 prompt sequence.
