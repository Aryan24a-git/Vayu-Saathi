# REQUIREMENTS.md — Clear Air Companion

> Status legend: UNVERIFIED | IN_PROGRESS | VERIFIED | DEFERRED

## Functional Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| REQ-001 | Set location via city search (geocoding), opt-in browser geolocation, or manual AQI entry | Critical | UI + API | E2E + integration | UNVERIFIED |
| REQ-002 | Minimal household profile: members (age band, sensitivity flags), housing (sealing, purifier), cooking fuel, heating, commute modes, budget band | Critical | Domain + UI | Unit + component | UNVERIFIED |
| REQ-003 | Show current and short-term forecast air quality (PM2.5, AQI band, trend) with source and freshness | Critical | API + UI | Integration (mock) + E2E | UNVERIFIED |
| REQ-004 | Personalized daily low-emission routine by time-of-day, escalating with AQI band and vulnerability | Critical | Rules engine | Golden-fixture unit tests | UNVERIFIED |
| REQ-005 | Indoor air quality hacks tailored to housing, budget, members (free, low-cost, paid tiers) | Critical | Rules + catalog | Unit + E2E | UNVERIFIED |
| REQ-006 | Sustainable alternatives (commute, cooking, heating, waste, shopping) with feasibility and cost tier | High | Rules + catalog | Unit | UNVERIFIED |
| REQ-007 | Every recommendation shows direct impact: what changes, magnitude range, basis, confidence, benefit type (personal vs emissions) | Critical | Domain + UI | Unit + E2E | UNVERIFIED |
| REQ-008 | Sensitive-group-aware guidance, medical disclaimer, red-flag escalation copy | Critical | Rules + UI | Unit + manual review | UNVERIFIED |
| REQ-009 | GenAI narrative grounded on catalog: LLM selects/orders/phrases only catalog actions; structured output validated | Critical | AI module | Contract + guardrail tests | UNVERIFIED |
| REQ-010 | Deterministic fallback plan when LLM or AQI provider unavailable | Critical | AI + API | Failure-injection tests | UNVERIFIED |
| REQ-011 | Bounded follow-up Q&A limited to air quality scope | Medium | AI + UI | Guardrail tests | UNVERIFIED |
| REQ-012 | Shareable text and printable plan for communities | Medium | UI | Component + E2E | UNVERIFIED |
| REQ-013 | Plain-language copy, externalized strings (i18n-ready) | High | UI | Lint + review | UNVERIFIED |
| REQ-014 | Display data source, timestamp, staleness warning | High | UI | Component test | UNVERIFIED |
| REQ-015 | View, edit, clear local profile | High | UI | E2E | UNVERIFIED |
| REQ-016 | Community what-if calculator ('if N households do X') with ranges | Normal | Domain + UI | Unit | UNVERIFIED |

## Non-Functional Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| NFR-001 | Modular monolith, no DB, no queue, no extra services | High | Architecture | Audit | UNVERIFIED |
| NFR-002 | Usable on low-end mobile, slow networks, modern evergreen browsers | High | Frontend | Lighthouse throttled | UNVERIFIED |
| NFR-003 | 12-factor config, validated env at boot | High | Platform | Unit | UNVERIFIED |
| NFR-004 | Strict TypeScript, lint/format clean, files under 250 lines, functions under 40 lines | High | All | Static checks | UNVERIFIED |

## Security Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| SEC-001 | Zod validation of every request, env and external response | Critical | API | Unit + fuzz | UNVERIFIED |
| SEC-002 | Secrets server-only, never in client bundle or repo | Critical | Platform | Bundle grep + secret scan | UNVERIFIED |
| SEC-003 | Per-client rate limiting and daily LLM budget guard | High | API | Integration | UNVERIFIED |
| SEC-004 | Prompt-injection defenses: delimiting, no tool authority, schema-validated output, action-ID allowlist | Critical | AI | Adversarial tests | UNVERIFIED |
| SEC-005 | Security headers, strict CSP, same-origin CORS | High | Platform | Header test | UNVERIFIED |
| SEC-006 | SSRF-safe outbound calls: fixed host allowlist, no user-supplied URLs | High | API | Unit | UNVERIFIED |
| SEC-007 | No raw HTML rendering of model or user text | Critical | UI | Lint rule + test | UNVERIFIED |
| SEC-008 | Dependency audit and secret scanning in CI | High | CI | CI run | UNVERIFIED |
| SEC-009 | Log redaction: no coordinates, free text, keys | High | Observability | Unit | UNVERIFIED |
| SEC-010 | Request body size, timeout and field length limits | High | API | Integration | UNVERIFIED |

## Accessibility Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| A11Y-001 | WCAG 2.1 AA: semantic HTML, keyboard, visible focus | High | UI | axe + manual | UNVERIFIED |
| A11Y-002 | AQI never conveyed by color alone; contrast AA | High | UI | axe + review | UNVERIFIED |
| A11Y-003 | Labelled forms with associated, announced errors | High | UI | Component + axe | UNVERIFIED |
| A11Y-004 | Live-region announcements for loading, results, errors | Medium | UI | Component | UNVERIFIED |
| A11Y-005 | Reflow at 320px and 200% zoom, 44px targets, reduced motion | Medium | UI | Manual + E2E viewport | UNVERIFIED |
| A11Y-006 | Plain language (target grade 8 or lower), icons paired with text | Medium | Content | Review | UNVERIFIED |

## Performance Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| PERF-001 | LCP ≤ 2.5s and first-load JS ≤ 150KB gzip on throttled mobile | High | Frontend | Lighthouse + bundle report | UNVERIFIED |
| PERF-002 | AQI cache (TTL 15 min, coords rounded) plus in-flight coalescing | High | API | Unit + measurement | UNVERIFIED |
| PERF-003 | One LLM call per plan; token cap; response cache by profile-shape hash | High | AI | Unit + measurement | UNVERIFIED |
| PERF-004 | Bounded memory: LRU max entries for all caches | Medium | API | Unit | UNVERIFIED |
| PERF-005 | Deterministic plan path p95 ≤ 300ms (excluding upstream) | Medium | Domain | Benchmark | UNVERIFIED |

## Reliability Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| REL-001 | Timeouts, bounded retry with backoff and jitter, circuit breaker on providers | High | API | Failure injection | UNVERIFIED |
| REL-002 | Degradation matrix honored (see ARCHITECTURE.md) | Critical | API + UI | E2E failure scenarios | UNVERIFIED |
| REL-003 | Health and readiness endpoints | Medium | API | Integration | UNVERIFIED |

## Observability Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| OBS-001 | Structured JSON logs with request ID | Medium | Platform | Unit | UNVERIFIED |
| OBS-002 | Counters in logs: fallback rate, provider failures, cache hit rate | Normal | Platform | Unit | UNVERIFIED |

## Testing Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| TEST-001 | Domain core coverage ≥ 90% lines | High | Domain | Coverage | UNVERIFIED |
| TEST-002 | API integration tests with MSW-mocked providers | High | API | CI | UNVERIFIED |
| TEST-003 | Component tests for key UI | Medium | UI | CI | UNVERIFIED |
| TEST-004 | E2E critical journey plus axe scan | Medium | E2E | CI | UNVERIFIED |
| TEST-005 | LLM contract and guardrail suite with fixtures (no live calls in CI) | High | AI | CI | UNVERIFIED |
| TEST-006 | CI gate blocks merge on failure | Medium | CI | CI run | UNVERIFIED |

## Deployment Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| DEP-001 | Reproducible production build and container image | High | Deploy | Build + run | UNVERIFIED |
| DEP-002 | CI pipeline: lint, types, tests, build, audit, secrets | High | CI | CI run | UNVERIFIED |
| DEP-003 | .env.example complete; boot fails fast on missing required env | High | Platform | Unit | UNVERIFIED |
| DEP-004 | Rollback and production verification steps documented | Medium | Deploy | Manual | UNVERIFIED |

## Data & Privacy Requirements

| ID | Requirement | Priority | Area | Validation | Status |
|----|-------------|----------|------|------------|--------|
| DATA-001 | No server persistence; coordinates rounded to 2 decimals before any use | Critical | All | Review + tests | UNVERIFIED |
| DATA-002 | Versioned local profile schema with safe migration and one-click clear | High | UI | Unit + E2E | UNVERIFIED |
| DATA-003 | Consent copy for geolocation and for sending anonymized profile to the LLM provider | High | UI | E2E | UNVERIFIED |
| DATA-004 | Every impact figure has source note and confidence; unsourced figures banned | Critical | Catalog | Schema test (build fails) | UNVERIFIED |
