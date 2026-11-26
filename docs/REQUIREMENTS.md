# REQUIREMENTS.md — Clear Air Companion & VayuSaathi
> Version: 3.0.0 | Change Request: 2026-11-24 | Authority: P1–P14 Shared V2 Protocol / Rule 7

> Status legend: UNVERIFIED | IN_PROGRESS | VERIFIED | DEFERRED

## Functional Requirements

| ID      | Requirement                                                                                                                                                 | Priority | Area            | Validation                 | Status     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- | -------------------------- | ---------- |
| REQ-001 | Set location via city search (geocoding), opt-in browser geolocation, or manual AQI entry                                                                   | Critical | UI + API        | E2E + integration          | VERIFIED   |
| REQ-002 | Household profile v2: vulnerabilities (kids, seniors, asthma, none), purifier, kitchen exhaust, commute mode, commute km, budget tier (migration from v1)  | Critical | Domain + UI     | Unit + component           | UNVERIFIED |
| REQ-003 | Live & hourly forecast air quality (PM2.5, PM10, NO2, wind, temperature) with model-data attribution and freshness                                         | Critical | API + UI        | Integration + E2E          | UNVERIFIED |
| REQ-004 | Personalized daily low-emission routine by time-of-day, escalating with AQI band and vulnerability                                                          | Critical | Rules engine    | Golden-fixture unit tests  | VERIFIED   |
| REQ-005 | Indoor air quality hacks tailored to housing, budget, members (zero-cost, DIY < ₹2,000, paid tiers)                                                         | Critical | Rules + catalog | Unit + E2E                 | VERIFIED   |
| REQ-006 | Sustainable alternatives (commute, cooking, heating, waste, shopping) with feasibility and cost tier                                                        | High     | Rules + catalog | Unit                       | VERIFIED   |
| REQ-007 | Every recommendation shows direct impact: what changes, magnitude range, basis, confidence, benefit type (personal vs emissions)                            | Critical | Domain + UI     | Unit + E2E                 | VERIFIED   |
| REQ-008 | Sensitive-group-aware guidance, medical disclaimer, red-flag escalation copy                                                                                | Critical | Rules + UI      | Unit + manual review       | VERIFIED   |
| REQ-009 | Grounded GenAI via Gemini: LLM rewrites phrasing/explainers for curated actions only; zero invented advice; structured output validated                     | Critical | AI module       | Contract + guardrail tests | UNVERIFIED |
| REQ-010 | Deterministic fallback plan when LLM or AQI provider unavailable                                                                                            | Critical | AI + API        | Failure-injection tests    | VERIFIED   |
| REQ-011 | Bounded follow-up Q&A via Gemini limited to air quality scope (multilingual: English, Hindi, Hinglish)                                                      | Medium   | AI + UI         | Guardrail tests            | UNVERIFIED |
| REQ-012 | Shareable text and printable plan for communities                                                                                                           | Medium   | UI              | Component + E2E            | UNVERIFIED |
| REQ-013 | Plain-language copy, externalized strings, Hindi language support in scope                                                                                  | High     | UI              | Lint + review              | UNVERIFIED |
| REQ-014 | Display data source, timestamp, staleness warning                                                                                                           | High     | UI              | Component test             | VERIFIED   |
| REQ-015 | View, edit, clear local profile                                                                                                                             | High     | UI              | E2E                        | UNVERIFIED |
| REQ-016 | Colony collective impact simulator ('if N families do X for 1 month') with honest commute math                                                              | Normal   | Domain + UI     | Unit                       | UNVERIFIED |
| REQ-017 | Multimodal Photo IAQ Audit (window gaps, kitchen exhaust, mask seal, bedroom layout; client-side resize, server validation)                                 | High     | AI + UI         | Unit + integration         | UNVERIFIED |
| REQ-018 | 1-Tap WhatsApp RWA Bulletin generator (bilingual English / Hindi with daytime safe vent windows and anti-burning pledges)                                    | High     | Domain + UI     | Unit + component           | UNVERIFIED |
| REQ-019 | Ward Smog Pinboard for citizen reporting (device-local storage, categories, local upvoting)                                                                 | Medium   | UI              | Component + E2E            | UNVERIFIED |
| REQ-020 | Interactive checklist pledges and live impact meter (exposure reduction %, cigarettes avoided, CO2 saved)                                                  | High     | UI              | Unit + component           | UNVERIFIED |
| REQ-021 | 24-hour dispersion chart with remaining-daytime ventilation window heuristic (today/tomorrow fallback, clearly labelled heuristic)                          | High     | Domain + UI     | Unit + E2E                 | UNVERIFIED |
| REQ-022 | Cigarette-equivalent indicator with transparent Berkeley Earth methodology note                                                                             | High     | Domain + UI     | Unit + component           | UNVERIFIED |
| REQ-023 | Demo winter scenarios clearly labelled as synthetic demos (no fabricated live station claims)                                                               | High     | Domain + UI     | Component + review         | UNVERIFIED |
| REQ-024 | Multilingual Copilot Chat supporting English, Hindi, and Hinglish queries with strict medical disclaimers                                                  | High     | AI + UI         | Unit + guardrail           | UNVERIFIED |
| REQ-025 | CPCB NAQI computation engine (PM2.5, PM10, NO2 sub-indices; US AQI optional config)                                                                         | Critical | Domain          | Unit tests                 | UNVERIFIED |

## Non-Functional Requirements

| ID      | Requirement                                                                           | Priority | Area         | Validation           | Status     |
| ------- | ------------------------------------------------------------------------------------- | -------- | ------------ | -------------------- | ---------- |
| NFR-001 | Modular monolith, no DB, no queue, no extra services                                  | High     | Architecture | Audit                | UNVERIFIED |
| NFR-002 | Usable on low-end mobile, slow networks, modern evergreen browsers                    | High     | Frontend     | Lighthouse throttled | UNVERIFIED |
| NFR-003 | 12-factor config, validated env at boot                                               | High     | Platform     | Unit                 | UNVERIFIED |
| NFR-004 | Strict TypeScript, lint/format clean, files under 250 lines, functions under 40 lines | High     | All          | Static checks        | UNVERIFIED |

## Security Requirements

| ID      | Requirement                                                                                            | Priority | Area          | Validation                | Status     |
| ------- | ------------------------------------------------------------------------------------------------------ | -------- | ------------- | ------------------------- | ---------- |
| SEC-001 | Zod validation of every request, env and external response                                             | Critical | API           | Unit + fuzz               | VERIFIED   |
| SEC-002 | Secrets server-only, never in client bundle or repo (GEMINI_API_KEY server-only)                       | Critical | Platform      | Bundle grep + secret scan | UNVERIFIED |
| SEC-003 | Per-client rate limiting and daily LLM budget guard                                                    | High     | API           | Integration               | UNVERIFIED |
| SEC-004 | Prompt-injection defenses: delimiting, no tool authority, schema-validated output, action-ID allowlist | Critical | AI            | Adversarial tests         | UNVERIFIED |
| SEC-005 | Security headers, strict CSP, same-origin CORS                                                         | High     | Platform      | Header test               | UNVERIFIED |
| SEC-006 | SSRF-safe outbound calls: fixed host allowlist, no user-supplied URLs                                  | High     | API           | Unit                      | VERIFIED   |
| SEC-007 | No raw HTML rendering of model or user text (React nodes and safe markdown only)                       | Critical | UI            | Lint rule + test          | UNVERIFIED |
| SEC-008 | Dependency audit and secret scanning in CI                                                             | High     | CI            | CI run                    | UNVERIFIED |
| SEC-009 | Log redaction: no coordinates, free text, chat text, images, or keys in server logs                    | High     | Observability | Unit                      | UNVERIFIED |
| SEC-010 | Request body size, timeout and field length limits                                                     | High     | API           | Integration               | VERIFIED   |
| SEC-011 | Image upload security: magic bytes check (JPEG/PNG/WebP), 256 kB cap, zero server storage              | Critical | API           | Unit + integration        | UNVERIFIED |
| SEC-012 | Zero client-side LLM calls or client API keys; all AI queries routed through server API boundaries    | Critical | Platform      | Static grep + audit       | UNVERIFIED |

## Accessibility Requirements

| ID       | Requirement                                                                             | Priority | Area    | Validation            | Status     |
| -------- | --------------------------------------------------------------------------------------- | -------- | ------- | --------------------- | ---------- |
| A11Y-001 | WCAG 2.1 AA: semantic HTML, keyboard, visible focus                                      | High     | UI      | axe + manual          | VERIFIED   |
| A11Y-002 | AQI never conveyed by color alone; contrast AA                                          | High     | UI      | axe + review          | VERIFIED   |
| A11Y-003 | Labelled forms with associated, announced errors                                        | High     | UI      | Component + axe       | VERIFIED   |
| A11Y-004 | Live-region announcements for loading, results, errors                                  | Medium   | UI      | Component             | VERIFIED   |
| A11Y-005 | Reflow at 320px and 200% zoom, 44px targets, reduced motion                             | Medium   | UI      | Manual + E2E viewport | VERIFIED   |
| A11Y-006 | Plain language (target grade 8 or lower), icons paired with text                        | Medium   | Content | Review                | VERIFIED   |
| A11Y-007 | Profile drawer focus trap, keyboard photo dropzone, chart text alternative, lang="hi"   | High     | UI      | axe + E2E             | UNVERIFIED |

## Performance Requirements

| ID       | Requirement                                                               | Priority | Area     | Validation                 | Status     |
| -------- | ------------------------------------------------------------------------- | -------- | -------- | -------------------------- | ---------- |
| PERF-001 | LCP ≤ 2.5s and first-load JS ≤ 150KB gzip on throttled mobile             | High     | Frontend | Lighthouse + bundle report | UNVERIFIED |
| PERF-002 | AQI cache (TTL 15 min, coords rounded) plus in-flight coalescing          | High     | API      | Unit + measurement         | VERIFIED   |
| PERF-003 | One LLM call per plan; token cap; response cache by profile-shape hash    | High     | AI       | Unit + measurement         | VERIFIED   |
| PERF-004 | Bounded memory: LRU max entries for all caches                            | Medium   | API      | Unit                       | VERIFIED   |
| PERF-005 | Deterministic plan path p95 ≤ 300ms (excluding upstream)                  | Medium   | Domain   | Benchmark                  | VERIFIED   |
| PERF-006 | Lazy loading and code splitting for non-critical widgets and modals       | Medium   | Frontend | Bundle analysis            | UNVERIFIED |

## Reliability Requirements

| ID      | Requirement                                                                   | Priority | Area     | Validation            | Status   |
| ------- | ----------------------------------------------------------------------------- | -------- | -------- | --------------------- | -------- |
| REL-001 | Timeouts, bounded retry with backoff and jitter, circuit breaker on providers | High     | API      | Failure injection     | VERIFIED |
| REL-002 | Degradation matrix honored (see ARCHITECTURE.md)                              | Critical | API + UI | E2E failure scenarios | VERIFIED |
| REL-003 | Health and readiness endpoints                                                | Medium   | API      | Integration           | VERIFIED |

## Observability Requirements

| ID      | Requirement                                                        | Priority | Area     | Validation | Status   |
| ------- | ------------------------------------------------------------------ | -------- | -------- | ---------- | -------- |
| OBS-001 | Structured JSON logs with request ID                               | Medium   | Platform | Unit       | VERIFIED |
| OBS-002 | Counters in logs: fallback rate, provider failures, cache hit rate | Normal   | Platform | Unit       | VERIFIED |

## Testing Requirements

| ID       | Requirement                                                          | Priority | Area   | Validation | Status     |
| -------- | -------------------------------------------------------------------- | -------- | ------ | ---------- | ---------- |
| TEST-001 | Domain core coverage ≥ 90% lines                                     | High     | Domain | Coverage   | UNVERIFIED |
| TEST-002 | API integration tests with MSW-mocked providers                      | High     | API    | CI         | UNVERIFIED |
| TEST-003 | Component tests for key UI                                           | Medium   | UI     | CI         | UNVERIFIED |
| TEST-004 | E2E critical journeys plus axe scan across viewports                 | Medium   | E2E    | CI         | UNVERIFIED |
| TEST-005 | LLM contract and guardrail suite with fixtures (no live calls in CI) | High     | AI     | CI         | UNVERIFIED |
| TEST-006 | CI gate blocks merge on failure                                      | Medium   | CI     | CI run     | UNVERIFIED |

## Deployment Requirements

| ID      | Requirement                                                    | Priority | Area     | Validation  | Status     |
| ------- | -------------------------------------------------------------- | -------- | -------- | ----------- | ---------- |
| DEP-001 | Reproducible production build and container image              | High     | Deploy   | Build + run | UNVERIFIED |
| DEP-002 | CI pipeline: lint, types, tests, build, audit, secrets         | High     | CI       | CI run      | UNVERIFIED |
| DEP-003 | .env.example complete (GEMINI_API_KEY); boot fails fast on bad env | High | Platform | Unit    | UNVERIFIED |
| DEP-004 | Rollback and production verification steps documented          | Medium   | Deploy   | Manual      | UNVERIFIED |

## Data & Privacy Requirements

| ID       | Requirement                                                                               | Priority | Area    | Validation                | Status     |
| -------- | ----------------------------------------------------------------------------------------- | -------- | ------- | ------------------------- | ---------- |
| DATA-001 | No server persistence; coordinates rounded to 2 decimals before any use                   | Critical | All     | Review + tests            | VERIFIED   |
| DATA-002 | Versioned local profile schema with safe migration and one-click clear                    | High     | UI      | Unit + E2E                | UNVERIFIED |
| DATA-003 | Consent copy for geolocation and for sending anonymized profile to the LLM provider       | High     | UI      | E2E                       | VERIFIED   |
| DATA-004 | Every impact figure has source note and confidence; unsourced figures rough-estimated     | Critical | Catalog | Schema test (build fails) | UNVERIFIED |
| DATA-005 | User photos and conversational chat text are never persisted to disk or logged in backend | Critical | API     | Code audit + tests        | UNVERIFIED |
