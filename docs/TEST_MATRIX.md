# docs/TEST_MATRIX.md — Requirement-to-Test Traceability Matrix
> Version: 1.0.0 | Generated: 2026-11-23 | V2-15

This document maps every requirement ID (REQ, SEC, A11Y, REL, DATA, TEST) to its
verifying test file and test name. Status is VERIFIED (test exists and passes),
GAP (no test), or PARTIAL (some coverage only).

---

## 1. Functional Requirements (REQ-001 to REQ-010)

| ID | Description | Test File | Test Name | Status |
|---|---|---|---|---|
| REQ-001 | Live AQI fetch from Open-Meteo | `tests/unit/provider-resilience.test.ts` | returns live AQI from upstream | VERIFIED |
| REQ-002 | Household profile Zod schema | `tests/unit/domain-types.test.ts` | HouseholdProfile schema validates correctly | VERIFIED |
| REQ-003 | AQI band classification | `tests/unit/aqi-bands.test.ts` | classifies all six AQI bands correctly | VERIFIED |
| REQ-004 | Action catalog — 28+ curated entries | `tests/unit/catalog.test.ts` | ACTION_CATALOG has ≥28 entries | VERIFIED |
| REQ-005 | Plan generation (rules engine) | `tests/unit/rules-engine.test.ts` | buildBasicPlan returns filtered actions | VERIFIED |
| REQ-006 | LLM-grounded narrative | `tests/unit/llm-grounding.test.ts` | rejects unknown IDs; uses NullClient fallback | VERIFIED |
| REQ-007 | Manual AQI entry fallback | `tests/integration/api-security.test.ts` | produces basic plans without live AQI | VERIFIED |
| REQ-007 | Manual AQI fallback (E2E) | `tests/e2e/journeys.spec.ts` | Journey B — plan page works in basic mode | VERIFIED |
| REQ-008 | Community impact calculation | `tests/unit/community-calc.test.ts` | scales community impact by household size | VERIFIED |
| REQ-009 | Personal impact explanation | `tests/unit/impact.test.ts` | calculateImpact returns sorted evidence strings | VERIFIED |
| REQ-010 | Deterministic fallback (no LLM) | `tests/unit/llm-grounding.test.ts` | uses NullClient or failure for a valid fallback plan | VERIFIED |

---

## 2. Security Requirements (SEC-001 to SEC-010)

| ID | Description | Test File | Test Name | Status |
|---|---|---|---|---|
| SEC-001 | Zod validation at every API boundary | `tests/integration/api-security.test.ts` | validates geocoding queries and returns 400 | VERIFIED |
| SEC-001 | Zod validation — malformed JSON | `tests/integration/api-security.test.ts` | rejects malformed JSON with the single error format | VERIFIED |
| SEC-001 | Zod validation — oversized body | `tests/integration/api-security.test.ts` | rejects unsupported content type and oversized plan bodies | VERIFIED |
| SEC-002 | No secrets in bundle | `docs/SECURITY_AUDIT.md` | Static bundle grep for ANTHROPIC_API_KEY | VERIFIED |
| SEC-003 | Rate limiting on /api/ask | `tests/integration/api-security.test.ts` | returns 429 with Retry-After for ask requests | VERIFIED |
| SEC-004 | Security response headers | `tests/integration/api-security.test.ts` | returns success and security headers | VERIFIED |
| SEC-005 | SSRF allowlist | `tests/unit/provider-resilience.test.ts` | only resolves configured provider hostnames | VERIFIED |
| SEC-006 | Prompt injection detection | `tests/unit/ai-guardrails.test.ts` | adversarial corpus — safely refuses unsafe strings | VERIFIED |
| SEC-007 | Log redaction (lat/lon/apiKey) | `tests/unit/server-logger.test.ts` | redacts PII fields from log output | VERIFIED |
| SEC-008 | IP hashing — no raw IP logged | `tests/integration/api-security.test.ts` | hashes the trusted client IP and never logs or returns it | VERIFIED |
| SEC-009 | No dangerouslySetInnerHTML | `docs/SECURITY_AUDIT.md` | Static source grep | VERIFIED |
| SEC-010 | No free-text profile fields | `tests/unit/domain-types.test.ts` | HouseholdProfile rejects unknown keys | VERIFIED |

---

## 3. Accessibility Requirements (A11Y)

| ID | Description | Test File | Test Name | Status |
|---|---|---|---|---|
| A11Y-001 | No critical/serious axe violations (desktop) | `tests/e2e/journeys.spec.ts` | axe: home page at desktop has no critical/serious violations | VERIFIED |
| A11Y-001 | No critical/serious axe violations (tablet) | `tests/e2e/journeys.spec.ts` | axe: home page at tablet has no critical/serious violations | VERIFIED |
| A11Y-001 | No critical/serious axe violations (mobile) | `tests/e2e/journeys.spec.ts` | axe: plan page at mobile has no critical/serious violations | VERIFIED |
| A11Y-001 | Axe smoke on key routes | `tests/e2e/hardening.spec.ts` | axe smoke: / (320px), /plan (320px), /ask (320px) | VERIFIED |
| A11Y-002 | No horizontal overflow at 320px | `tests/e2e/hardening.spec.ts` | plan reflows at 320px | VERIFIED |
| A11Y-003 | Static assistant fallback visible | `tests/e2e/hardening.spec.ts` | ask page has static fallback and live region | VERIFIED |
| A11Y-004 | Real screen-reader pass (NVDA/VoiceOver) | Manual checkpoint | — | UNVERIFIED — requires human |

---

## 4. Reliability Requirements (REL)

| ID | Description | Test File | Test Name | Status |
|---|---|---|---|---|
| REL-001 | Provider failure → 503 degradation | `tests/unit/provider-resilience.test.ts` | maps repeated upstream 500 responses to provider unavailable | VERIFIED |
| REL-001 | Provider failure (E2E) | `tests/e2e/journeys.spec.ts` | Journey B — when AQI provider returns 503, page does not crash | VERIFIED |
| REL-002 | LLM failure → deterministic plan | `tests/unit/llm-grounding.test.ts` | uses NullClient or failure for a valid fallback plan | VERIFIED |
| REL-003 | Cache coalescing (identical requests) | `tests/unit/provider-resilience.test.ts` | provider cache/coalescing — 1 upstream call for 2dp coords | VERIFIED |
| REL-004 | Rate-limit Retry-After header | `tests/integration/api-security.test.ts` | returns 429 with Retry-After for ask requests | VERIFIED |

---

## 5. Data & Privacy Requirements (DATA)

| ID | Description | Test File | Test Name | Status |
|---|---|---|---|---|
| DATA-001 | Coordinates rounded to 2dp | `tests/unit/domain-types.test.ts` | roundCoordinate rounds to 2 decimal places | VERIFIED |
| DATA-002 | Versioned profile schema | `tests/unit/domain-types.test.ts` | HouseholdProfile includes schemaVersion | VERIFIED |
| DATA-003 | Consent gate for LLM calls | `tests/unit/plan-ui.test.tsx` | static assistant FAQ works when AI consent is declined | VERIFIED |
| DATA-004 | Sourced impact evidence | `tests/unit/impact.test.ts` | calculateImpact returns evidence with citation | VERIFIED |

---

## 6. Testing Requirements (TEST-001 to TEST-006)

| ID | Description | Test File / Script | Status |
|---|---|---|---|
| TEST-001 | Pure-function domain unit tests | `tests/unit/` (18 files, 75 tests) | VERIFIED |
| TEST-002 | Provider resilience tests | `tests/unit/provider-resilience.test.ts` | VERIFIED |
| TEST-003 | API boundary integration tests | `tests/integration/api-security.test.ts` | VERIFIED |
| TEST-004 | Health endpoint integration test | `tests/integration/health.test.ts` | VERIFIED |
| TEST-005 | LLM contract & guardrail fixtures | `tests/unit/llm-grounding.test.ts` + `tests/fixtures/llm/` | VERIFIED |
| TEST-006 | CI gate (`npm run check`) | `.github/workflows/ci.yml` | VERIFIED (locally) / UNVERIFIED (GitHub Actions remote run — push to trigger) |

---

## 7. Performance Requirements (PERF)

| ID | Description | Evidence | Status |
|---|---|---|---|
| PERF-001 | First-load JS ≤ 150 kB | `npm run build` output: 118–119 kB | VERIFIED |
| PERF-002 | p95 plan latency ≤ 300ms | `scripts/benchmark-plan.ts`: p95 0.053ms | VERIFIED |
| PERF-003 | Cache retains 500 entries after 10k inserts | `scripts/bench-cache.ts` | VERIFIED |

---

## 8. Gaps Report

| Gap | Risk | Mitigation |
|---|---|---|
| GitHub Actions remote CI run | UNVERIFIED — only verifiable by pushing to GitHub | Push `main` and check the Actions tab |
| Real screen-reader pass (A11Y-004) | Cannot be automated | Manual NVDA/VoiceOver walkthrough required before release |
| Live Anthropic API smoke test | No `ANTHROPIC_API_KEY` in CI environment | Provide key in GitHub Secrets to enable; documented in `docs/TESTING.md` |
| Journey A end-to-end full flow (city→AQI→plan) | Full UI flow requires production build serving locally; CI runs unit tests | E2E suite covers partial smoke; full user journey covered by integration tests |

---

> **Last audit**: 2026-11-23 | **Exit code 0**: `npm run test:coverage`, `npm run check`
