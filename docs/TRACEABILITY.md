# docs/TRACEABILITY.md — Requirement Traceability Matrix (V3.0.0)
> Version: 3.0.0 | Change Request: 2026-11-24 | Authority: P1–P14 Shared V2 Protocol / Rule 7

This document establishes bidirectional traceability from Problem Space & Evaluation Criteria to Requirements, Code Modules, V2 Prompts (including CR Stages V2-20 through V2-25), and Verification Evidence.

---

## 1. Complete Requirement Traceability Matrix

| ID | Requirement / Criterion | Source | Implementation Area | V2 Prompt(s) | Validation Method | Priority | Status | Verification Proof |
|---|---|---|---|---|---|---|---|---|
| **REQ-001** | Location input paths | Problem | UI + API | 03, 06, 08 | E2E, integration | Critical | **VERIFIED** | `tests/unit/provider-resilience.test.ts`, `src/lib/providers/geocoding.ts` |
| **REQ-002** | Household profile v2 | Problem | Domain + UI | 01, 08, 21 | Unit, component | Critical | **UNVERIFIED** | Reset for CR (Schema v2 household-level fields & v1 migration) |
| **REQ-003** | Live and forecast air quality | Problem | Provider + UI | 03, 06, 09, 21 | Integration, E2E | Critical | **UNVERIFIED** | Reset for CR (Hourly PM, wind, temp & model attribution) |
| **REQ-004** | Daily low-emission routine | Problem | Rules | 02, 04, 09 | Golden fixtures | Critical | **VERIFIED** | `tests/unit/rules.test.ts`, `src/domain/plan.ts` |
| **REQ-005** | Indoor air hacks | Problem | Rules + catalog | 02, 04, 10 | Unit, E2E | Critical | **VERIFIED** | `tests/unit/plan-ui.test.tsx`, `src/catalog/catalog.json` |
| **REQ-006** | Sustainable alternatives | Problem | Rules + catalog | 02, 04, 10 | Unit | High | **VERIFIED** | `tests/unit/catalog.test.ts`, `src/domain/catalog/actions.alternatives.ts` |
| **REQ-007** | Direct impact explanation | Problem | Domain + UI | 02, 04, 09, 10, 11 | Unit, E2E | Critical | **VERIFIED** | `tests/unit/impact.test.ts`, `src/domain/explain.ts` |
| **REQ-008** | Sensitive-group safety | Problem | Rules + UI | 02, 04, 09 | Unit, review | Critical | **VERIFIED** | `tests/unit/rules.test.ts`, `src/domain/rules/safety.ts` |
| **REQ-009** | Grounded GenAI (Gemini) | Problem | LLM module | 05, 06, 22 | Contract, guardrail | Critical | **UNVERIFIED** | Reset for CR (Single provider: Gemini, rewrites wording only) |
| **REQ-010** | Deterministic fallback | Problem | Rules + API + UI | 04, 05, 06, 09, 12 | Failure injection | Critical | **VERIFIED** | `tests/unit/llm-grounding.test.ts`, `src/domain/plan.ts` (0-key mode) |
| **REQ-011** | Bounded Q&A (Multilingual) | Problem | LLM + UI | 05, 12, 22 | Guardrail, E2E | Medium | **UNVERIFIED** | Reset for CR (Gemini English, Hindi, Hinglish bounded scope) |
| **REQ-012** | Share and print | Problem | UI | 11 | Unit, E2E | Medium | **VERIFIED** | `tests/unit/plan-ui.test.tsx`, `src/features/share/planToText.ts` |
| **REQ-013** | Plain language, Hindi in scope | EC-006 | UI | 07, 14, 23 | Readability script | High | **UNVERIFIED** | Reset for CR (Bilingual WhatsApp & Copilot Hindi content) |
| **REQ-014** | Source and freshness display | Problem | UI | 03, 09 | Component | High | **VERIFIED** | `src/features/plan/AirQualityCard.tsx`, `provider-resilience.test.ts` |
| **REQ-015** | Edit/clear profile | Problem | UI | 08 | E2E | High | **VERIFIED** | `tests/e2e/journeys.spec.ts` (Journey C - localStorage clear) |
| **REQ-016** | Colony what-if | Problem | Domain + UI | 02, 11 | Unit | Normal | **VERIFIED** | `tests/unit/community-calc.test.ts`, `ColonySimulator.tsx` |
| **REQ-017** | Multimodal Photo IAQ Audit | Problem | AI + UI | 22, 23 | Unit, integration | High | **UNVERIFIED** | New requirement (sealing, exhaust, mask, layout inspection) |
| **REQ-018** | WhatsApp/RWA Bulletin (EN/HI) | Problem | Domain + UI | 21, 23 | Unit, component | High | **UNVERIFIED** | New requirement (1-tap bilingual bulletin generator) |
| **REQ-019** | Hotspot Pinboard (device-local)| Problem | UI | 23 | Component, E2E | Medium | **UNVERIFIED** | New requirement (category tagging, upvoting, device-local) |
| **REQ-020** | Pledges & Live Impact Meter | Problem | UI | 23 | Component, E2E | High | **UNVERIFIED** | New requirement (dynamic exposure drop, cigs avoided, CO2) |
| **REQ-021** | 24h Dispersion & Vent Window | Problem | Domain + UI | 21, 23 | Unit, E2E | High | **UNVERIFIED** | New requirement (dynamic remaining-daytime heuristic window) |
| **REQ-022** | Cigarette-Equivalent Indicator | Problem | Domain + UI | 21, 23 | Unit, review | High | **UNVERIFIED** | New requirement (Berkeley Earth methodology transparency note) |
| **REQ-023** | Clearly Labelled Demo Scenarios| Problem | Domain + UI | 21, 23 | Component, review | High | **UNVERIFIED** | New requirement (synthetic demo badge, no fake live station claim) |
| **REQ-024** | Multilingual Copilot Chat | Problem | AI + UI | 22, 23 | Guardrail, E2E | High | **UNVERIFIED** | New requirement (English, Hindi, Hinglish chat with guardrails) |
| **REQ-025** | CPCB NAQI Computation | Problem | Domain | 21 | Unit tests | Critical | **UNVERIFIED** | New requirement (pure function CPCB breakpoints & sub-indices) |
| **NFR-001** | Simple modular monolith | EC-001 | Architecture | 00, 19 | Audit, madge | High | **VERIFIED** | Next.js 14 App Router, 0 DB, 0 microservices, madge 0 cycles |
| **NFR-002** | Low-end, slow network | EC-006 | Frontend | 07, 13 | Lighthouse | High | **VERIFIED** | 116 kB First Load JS, Service Worker caching, 320px reflow |
| **NFR-003** | 12-factor config | EC-001/003 | Config | 00, 01, 22 | Unit | High | **UNVERIFIED** | Reset for CR (GEMINI_API_KEY, GEMINI_MODEL validation) |
| **NFR-004** | Strict quality limits | EC-001 | All | 00, 19, 24 | Lint, reports | High | **VERIFIED** | 0 files > 250 lines, functions < 40 lines, strict TS, ESLint clean |
| **SEC-001** | Zod at all boundaries | EC-003 | API | 01, 06 | Unit, fuzz | Critical | **VERIFIED** | `tests/integration/api-security.test.ts`, `src/server/security/limits.ts`|
| **SEC-002** | Secrets server-only | EC-003 | Platform | 00, 05, 22 | Bundle grep, scans | Critical | **UNVERIFIED** | Reset for CR (GEMINI_API_KEY server-only; zero browser key access) |
| **SEC-003** | Rate limit, LLM budget | EC-003/004 | API | 05, 06, 22 | Integration | High | **UNVERIFIED** | Reset for CR (Per-client token bucket on all AI routes) |
| **SEC-004** | Prompt-injection defenses | EC-003 | LLM | 05, 12, 22 | Adversarial corpus | Critical | **UNVERIFIED** | Reset for CR (Multilingual injection defense in EN/HI/Hinglish) |
| **SEC-005** | Headers, CSP, CORS | EC-003 | Platform | 06, 16, 22 | Header tests | High | **UNVERIFIED** | Reset for CR (Strict CSP with zero external CDNs) |
| **SEC-006** | SSRF-safe outbound | EC-003 | API | 03, 06 | Unit | High | **VERIFIED** | Hardcoded allowlist in `src/server/providers/openMeteoAirQuality.ts` |
| **SEC-007** | No raw HTML rendering | EC-003 | UI | 07, 09, 23 | Lint, test | Critical | **UNVERIFIED** | Reset for CR (Safe React node rendering, zero innerHTML) |
| **SEC-008** | Dependency and secret scans | EC-003 | CI | 15, 16 | CI run | High | **VERIFIED (With Warnings)** | `docs/SECURITY_AUDIT.md` (Next.js 14 & Zod 3 CVEs documented & mitigated) |
| **SEC-009** | Log redaction | EC-003 | Observability | 01, 06, 22 | Unit | High | **UNVERIFIED** | Reset for CR (Zero logging of chat text, photos, or API keys) |
| **SEC-010** | Size, timeout limits | EC-003 | API | 03, 06 | Integration | High | **VERIFIED** | 16 kB / 256 kB payload limit in `limits.ts`, 4000ms fetch timeouts |
| **SEC-011** | Image upload security | EC-003 | API | 22 | Unit, integration | Critical | **UNVERIFIED** | New requirement (Magic bytes check JPEG/PNG/WebP, 256kB cap, no disk)|
| **SEC-012** | No client-side LLM calls | EC-003 | Platform | 22 | Static grep | Critical | **UNVERIFIED** | New requirement (All AI calls exclusively server-side) |
| **A11Y-001**| WCAG semantic, keyboard, focus | EC-006 | UI | 07, 09, 14, 17 | axe + manual | High | **VERIFIED** | `@axe-core/playwright` 0 critical/serious violations across 3 viewports |
| **A11Y-002**| No color-only, contrast | EC-006 | UI | 07, 09, 10, 14 | Script, axe | High | **VERIFIED** | Textual badges + icons in `AqiHeroCard.tsx`, WCAG AA contrast |
| **A11Y-003**| Labelled forms and errors | EC-006 | UI | 08, 11, 14 | Component, axe | High | **VERIFIED** | Accessible form controls in `ProfileDrawer.tsx` |
| **A11Y-004**| Live regions | EC-006 | UI | 07, 08, 09, 12, 14 | Component | Medium | **VERIFIED** | `aria-live` polite regions in toast and copilot chat |
| **A11Y-005**| Reflow, targets, motion | EC-006 | UI | 07, 14, 17 | Viewport E2E | Medium | **VERIFIED** | `tests/e2e/hardening.spec.ts` (Reflows at 320px with no horizontal scroll)|
| **A11Y-006**| Plain language | EC-006 | Content | 02, 10, 14 | Readability script | Medium | **VERIFIED** | `scripts/readability.ts` (25 UI strings, max grade 8.73 ≤ 9) |
| **A11Y-007**| Drawer trap, keyboard dropzone | EC-006 | UI | 23 | axe + manual | High | **UNVERIFIED** | New requirement (Drawer focus trap, dropzone keyboard, lang="hi") |
| **PERF-001**| LCP and JS budget | EC-004 | Frontend | 07, 13, 23 | Lighthouse | High | **UNVERIFIED** | Reset for CR (Re-measured build: 116 kB First Load JS ≤ 150 kB) |
| **PERF-002**| AQI cache, coalescing | EC-004 | API | 03, 13 | Unit, measurement | High | **VERIFIED** | `tests/unit/provider-resilience.test.ts` (1 upstream call for identical 2dp)|
| **PERF-003**| One LLM call, cache | EC-004 | LLM | 05, 13, 22 | Unit, measurement | High | **UNVERIFIED** | Reset for CR (Gemini request caching and token caps) |
| **PERF-004**| Bounded memory | EC-004 | API | 03, 13 | Unit, heap test | Medium | **VERIFIED** | `scripts/bench-cache.ts` (Retains exactly 500 entries after 10,000 inserts)|
| **PERF-005**| Plan path p95 | EC-004 | Domain | 04, 13 | Benchmark | Medium | **VERIFIED** | `scripts/benchmark-plan.ts` (p95 = 0.087 ms, threshold 300 ms) |
| **PERF-006**| Lazy load non-critical widgets | EC-004 | Frontend | 23 | Bundle analysis | Medium | **UNVERIFIED** | New requirement (Code splitting and lazy loading of modal drawers) |
| **REL-001** | Timeouts, retry, breaker | EC-003/005 | API | 03, 05 | Failure injection | High | **VERIFIED** | `src/server/http/resilience.ts`, `provider-resilience.test.ts` |
| **REL-002** | Degradation matrix | Problem | API + UI | 06, 09, 12, 14, 17 | E2E scenarios | Critical | **VERIFIED** | `tests/e2e/journeys.spec.ts` (Journey B - provider 503 fallback) |
| **REL-003** | Health, readiness | Ops | API | 06, 18 | Integration | Medium | **VERIFIED** | `/api/health` and `/api/ready` verified via live curl |
| **OBS-001** | Structured logs, request ID | Ops | Platform | 01, 06, 18 | Unit | Medium | **VERIFIED** | `src/server/http/requestId.ts`, `tests/unit/server-logger.test.ts` |
| **OBS-002** | Counters in logs | EC-004 | Platform | 03, 18 | Unit | Normal | **VERIFIED** | Telemetry counters: `cacheHit`, `providerFailure`, `breakerOpen`, `fallbackRate`|
| **TEST-001**| Domain coverage 90% | EC-005 | Domain | 04, 15, 24 | Coverage | High | **UNVERIFIED** | Reset for CR (Coverage on new domain modules: CPCB NAQI, Playbook) |
| **TEST-002**| API integration tests | EC-005 | API | 06, 15, 24 | CI | High | **UNVERIFIED** | Reset for CR (Integration tests on `/api/playbook`, `/api/audit`, etc.)|
| **TEST-003**| Component tests | EC-005 | UI | 08 to 12, 15, 24 | CI | Medium | **UNVERIFIED** | Reset for CR (Tests on VayuSaathi hero, tabs, and drawer) |
| **TEST-004**| E2E plus axe across viewports| EC-005/006 | E2E | 15, 17, 24 | CI | Medium | **UNVERIFIED** | Reset for CR (28 Playwright tests across mobile, tablet, desktop) |
| **TEST-005**| LLM contract and guardrails | EC-005 | LLM | 05, 15, 24 | CI | High | **UNVERIFIED** | Reset for CR (Gemini guardrail fixtures in CI without live keys) |
| **TEST-006**| CI gate | EC-005 | CI | 15, 24 | CI run | Medium | **UNVERIFIED** | Reset for CR (`npm run check` pipeline) |
| **DEP-001** | Reproducible build and image | Ops | Deploy | 18 | docker build/run | High | **UNVERIFIED** | Multi-stage Dockerfile written; container execution unverified |
| **DEP-002** | CI pipeline | Ops | CI | 15, 18 | CI run | High | **VERIFIED** | `.github/workflows/ci.yml` and `.github/workflows/cd.yml` |
| **DEP-003** | Env contract, fail-fast | Ops | Platform | 00, 01, 22 | Unit | High | **UNVERIFIED** | Reset for CR (Switched from Anthropic to Gemini vars) |
| **DEP-004** | Rollback and verification | Ops | Deploy | 18 | Rehearsal | Medium | **UNVERIFIED** | Rollback procedure documented in `docs/RUNBOOK.md` |
| **DATA-001**| Data minimization | Privacy | All | 01, 08, 16 | Review, tests | Critical | **VERIFIED** | Coordinates truncated to 2dp (~1 km); zero server persistence |
| **DATA-002**| Versioned local profile, clear | Privacy | UI | 01, 08, 21 | Unit, E2E | High | **UNVERIFIED** | Reset for CR (Schema v2 with automatic migration from v1) |
| **DATA-003**| Consent copy and gate | Privacy | UI + LLM | 05, 08, 16 | E2E | High | **VERIFIED** | `tests/unit/plan-ui.test.tsx` (Static FAQ active when AI consent declined) |
| **DATA-004**| Sourced impact figures | EC-002 | Catalog | 02, 19, 21 | Schema test | Critical | **UNVERIFIED** | Reset for CR (Transparent notes on cigarette & commute equivalencies) |
| **DATA-005**| Zero persistence of chat/images| Privacy | API | 22 | Review, tests | Critical | **UNVERIFIED** | New requirement (Photos and chat queries never stored or logged) |
| **EC-001**  | Code quality (High) | Criteria | All | 00, 19, 25 | Lint, reports, audit | High | **UNVERIFIED** | Re-earned in V2-25 |
| **EC-002**  | Problem alignment (High) | Criteria | Domain + features | 02, 04, 05, 25 | Golden fixtures, E2E | High | **UNVERIFIED** | Re-earned in V2-25 |
| **EC-003**  | Security (Medium) | Criteria | Platform + API | 05, 06, 25 | Security audit | Medium | **UNVERIFIED** | Re-earned in V2-25 |
| **EC-004**  | Efficiency (Medium) | Criteria | API + frontend | 03, 05, 25 | Before/after table | Medium | **UNVERIFIED** | Re-earned in V2-25 |
| **EC-005**  | Testing (Low) | Criteria | QA | 04, 15, 25 | CI | Low | **UNVERIFIED** | Re-earned in V2-25 |
| **EC-006**  | Accessibility (Low) | Criteria | UI | 07, 14, 25 | axe + manual | Low | **UNVERIFIED** | Re-earned in V2-25 |
