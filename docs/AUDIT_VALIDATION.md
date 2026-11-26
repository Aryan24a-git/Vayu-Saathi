# docs/AUDIT_VALIDATION.md — Clear Air Companion Full Audit Validation
> Version: 1.0.0 | Validated: 2026-11-23 | V2-17 | Auditor: AI Agent (automated)
> Protocol: P1–P14 Shared V2 Protocol. Evidence labels: VERIFIED / UNVERIFIED / BLOCKED.

---

## 1. Build & Quality Gate Validation

| Step | Command | Result | Status |
|---|---|---|---|
| Format check | `npm run format:check` | All files pass Prettier | VERIFIED |
| Lint | `npm run lint` | 0 errors; pre-existing warnings on oversized functions (non-blocking) | VERIFIED |
| TypeScript | `npm run typecheck` | 0 errors, strict mode | VERIFIED |
| Unused exports | `npm run knip` | No unused files or exports found | VERIFIED |
| Circular deps | `npm run madge` | No circular dependencies | VERIFIED |
| Unit + integration tests | `npm run test` | **86/86 tests pass (20 test files)** | VERIFIED |
| Domain coverage | `npm run test:coverage` | **99.08% lines** (threshold ≥90%) | VERIFIED |
| Production build | `npm run build` | Exit 0; `/` 119 kB, `/plan` 118 kB, `/ask` 90 kB | VERIFIED |
| Full gate | `npm run check` | **Exit code 0** | VERIFIED |

---

## 2. Security Audit Summary (from SECURITY_AUDIT.md)

| Finding ID | Severity | Status |
|---|---|---|
| SEC-FIND-001 (Next.js CVEs) | CRITICAL | OPEN — upgrade required before prod deploy |
| SEC-FIND-002 (Zod OOM) | HIGH | OPEN — mitigated by body size limit |
| SEC-FIND-003 (tinypool RCE) | CRITICAL | OPEN — dev-only, prod risk = NONE |
| SEC-FIND-004 (postcss path traversal) | CRITICAL | OPEN — build-time only, no user CSS |
| SEC-FIND-005 (glob cmd injection) | HIGH | OPEN — dev-only, prod risk = NONE |
| SEC-FIND-006 (vitest mocker) | MODERATE | OPEN — dev-only, prod risk = NONE |
| SEC-FIND-007 (dangerouslySetInnerHTML) | — | CLOSED — PASS |
| SEC-FIND-008 (secrets in source/bundle) | — | CLOSED — PASS |
| SEC-FIND-009 (SSRF allowlist) | — | CLOSED — PASS |
| SEC-FIND-010 (prompt injection) | — | CLOSED — PASS |
| SEC-FIND-011 (log redaction) | — | CLOSED — PASS |
| SEC-FIND-012 (security headers) | — | CLOSED — PASS |
| SEC-FIND-013 (rate limiting) | — | CLOSED — PASS |

> [!IMPORTANT]
> Per V2 Protocol P10: severity is never downgraded to pass. OPEN findings are recorded in full.
> **Production-impacting open findings: SEC-FIND-001 (Next.js upgrade) and SEC-FIND-002 (Zod OOM, mitigated).**

---

## 3. EC-002 Alignment Demo — 3 Profiles × 3 AQI Overrides

**Purpose**: Confirm that the app does all three core verbs — **Suggest**, **Tailor**, **Explain** — and that
tailoring is visible across different user contexts and pollution levels.

**Command**: `npx tsx scripts/alignment-demo.ts`
**Exit code**: 0 (VERIFIED 2026-11-23)

### Results

```
=== P1 — Healthy adult, tight housing, free budget ===
  AQI=50:  band=good,      escalation=0, actions=5,  first3=[ACT-015, ACT-001, ACT-004]
  AQI=150: band=usg,       escalation=2, actions=8,  first3=[ACT-015, ACT-002, ACT-003]
  AQI=350: band=hazardous, escalation=5, actions=9,  first3=[ACT-015, ACT-018, ACT-002]

=== P2 — Child with asthma, leaky housing, low budget ===
  AQI=50:  band=moderate,  escalation=1, actions=8,  first3=[ACT-015, ACT-003, ACT-001]
  AQI=150: band=unhealthy, escalation=3, actions=11, first3=[ACT-015, ACT-005, ACT-021]
  AQI=350: band=severe,    escalation=6, actions=12, first3=[ACT-015, ACT-018, ACT-005]

=== P3 — Senior COPD, average housing, medium budget + purifier ===
  AQI=50:  band=moderate,  escalation=1, actions=10, first3=[ACT-015, ACT-003, ACT-001]
  AQI=150: band=unhealthy, escalation=3, actions=11, first3=[ACT-015, ACT-005, ACT-021]
  AQI=350: band=severe,    escalation=6, actions=12, first3=[ACT-015, ACT-018, ACT-005]
```

### Analysis

| Dimension | Observation | EC-002 Verb |
|---|---|---|
| **Same AQI, different profile** | P1 at AQI=50 → band=`good` (escalation=0); P2+P3 at AQI=50 → band=`moderate` (escalation=1 due to asthma/COPD vulnerability). **Plans differ in band, escalation and action count.** | **Tailor** ✅ |
| **AQI escalation per profile** | P1 AQI 50→150→350: actions 5→8→9; band shifts `good→usg→hazardous`. Protective escalation increases action count and urgency. | **Suggest** ✅ |
| **Vulnerability escalation** | P2 (child+asthma) escalates 1 step above AQI-band baseline at every AQI level — domain rule D1 (protective escalation). | **Tailor** ✅ |
| **Impact explanation** | Each `BasicPlanItem` carries `explanation.personalImpact` and `explanation.sourceRange` via `explainAction()`. | **Explain** ✅ |
| **D6 Catalog grounding** | All action IDs (ACT-015, ACT-001, etc.) resolve to curated catalog entries — LLM cannot invent advice outside the catalog. | Safety ✅ |
| **D3 Do no harm** | At escalation=6 (severe/hazardous), ACT-018 (stay indoors + seal windows) is prioritised over ACT-001 (outdoor mask). No recommendation to open windows during peak smog. | Safety ✅ |

---

## 4. Degradation Matrix Validation (REL-001, REL-002)

| Failure | Fallback | Evidence | Status |
|---|---|---|---|
| AQI provider returns 503 | `ProviderError` caught; API returns 503 with typed error; `/api/plan?mode=basic` bypasses provider | `tests/unit/provider-resilience.test.ts` — "maps repeated upstream 500 responses to provider unavailable"; `tests/e2e/journeys.spec.ts` Journey B | VERIFIED |
| LLM client throws | `generatePersonalizedPlan` catches and returns `buildBasicPlan` output | `tests/unit/llm-grounding.test.ts` — "uses NullClient or failure for a valid fallback plan" | VERIFIED |
| Geolocation denied | City text search fallback via `/api/geocode` | Integration test + manual UI | VERIFIED |
| Network offline | `localStorage` cached profile; plan page renders with last-known data | Journey C E2E; localStorage test | VERIFIED |

---

## 5. Accessibility Validation (EC-006)

| Test | Tool | Viewports | Result | Status |
|---|---|---|---|---|
| `/` axe critical/serious | `@axe-core/playwright` | 1280px, 768px | 0 violations | VERIFIED |
| `/plan` axe critical/serious | `@axe-core/playwright` | 375px | 0 violations | VERIFIED |
| `/` 320px reflow | Playwright scroll-width check | 320px | No overflow | VERIFIED |
| `/ask` static fallback | Playwright text presence | desktop | "Static catalog guidance" visible | VERIFIED |
| Screen reader NVDA/VoiceOver | Manual | — | **UNVERIFIED — human required** | BLOCKED — manual |

> [!NOTE]
> Automated axe covers WCAG 2.1 AA programmatic checks. Real screen-reader pass requires
> a human to open the app in NVDA (Windows) or VoiceOver (macOS/iOS) and walk the full profile
> → plan journey. Mark as VERIFIED after successful manual pass.

---

## 6. Performance Validation (PERF-001 to PERF-003)

| Requirement | Evidence | Threshold | Actual | Status |
|---|---|---|---|---|
| PERF-001: First-load JS ≤ 150 kB | `npm run build` output | 150 kB | `/`: 119 kB, `/plan`: 118 kB | VERIFIED |
| PERF-002: p95 plan latency ≤ 300ms | `scripts/benchmark-plan.ts` | 300ms | p95 = 0.053ms | VERIFIED |
| PERF-003: Cache 500 entries after 10k inserts | `scripts/bench-cache.ts` | 500 entries retained | PASS | VERIFIED |

---

## 7. CI Gate Validation

| Step | Local | Remote (GitHub Actions) |
|---|---|---|
| `.github/workflows/ci.yml` file | Created: `.github/workflows/ci.yml` | UNVERIFIED — push to GitHub to verify |
| All 12 CI steps defined | Yes — format, lint, typecheck, knip, madge, test:coverage, build, bundle-size, audit, gitleaks, playwright install, E2E | VERIFIED (file exists) |
| CI runtime ≤ 10 minutes | Estimated based on local run times | UNVERIFIED — requires GitHub Actions run |
| Playwright E2E in CI | `npx playwright install --with-deps chromium` + `npm run test:e2e` | UNVERIFIED — requires GitHub Actions |

> **Human action required**: Push branch to GitHub and confirm the Actions run passes.
> CI URL after push: `https://github.com/<owner>/<repo>/actions`

---

## 8. Requirement-to-Test Completeness

See `docs/TEST_MATRIX.md` for the full requirement-to-test traceability table.

**Summary**:
- REQ-001 to REQ-010: All VERIFIED
- SEC-001 to SEC-010: All VERIFIED (automated tests)
- A11Y-001 to A11Y-003: VERIFIED; A11Y-004 UNVERIFIED (manual screen-reader)
- REL-001 to REL-004: All VERIFIED
- DATA-001 to DATA-004: All VERIFIED
- TEST-001 to TEST-005: All VERIFIED; TEST-006 VERIFIED locally / UNVERIFIED on GitHub

---

## 9. Open Manual Gates

| Gate | Action Required | Priority |
|---|---|---|
| GitHub Actions CI run | Push `main` branch; check Actions tab | HIGH |
| Screen-reader pass (NVDA or VoiceOver) | Manual walkthrough: home → profile → plan → assistant journey | MEDIUM |
| Live Anthropic API smoke test | Set `ANTHROPIC_API_KEY` in `.env.local` and run `npm run dev`; submit a plan request and confirm narrative returns | LOW (LLM optional by design) |
| Next.js upgrade to ^15 (SEC-FIND-001) | `npm install next@^15.3.0`; validate build; regression test | CRITICAL before public deploy |

---

> **Validation completed**: 2026-11-23
> **npm run check**: EXIT CODE 0 (86/86 tests, 99.08% domain coverage)
> **npm run build**: EXIT CODE 0 (production build passes)
