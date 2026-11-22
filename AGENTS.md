# AGENTS.md — Clear Air Companion Agent Contract
> Version: 1.0.0 | Last updated: 2026-11-22

This document is the authoritative contract for all AI agents (V2-00 through V2-19) building Clear Air Companion.
Every agent prompt references this file. No step in this contract may be skipped.

## The 14-Step Contract

Every agent working on this codebase MUST follow all 14 steps in order:

### Step 1 — Read Before Writing
Read all existing files in your area of concern before writing any code. Never overwrite existing work without reading it first.

### Step 2 — Domain Rules First
Check DOMAIN.md D1–D6 rules before writing any recommendation logic, catalog entries, or LLM prompts. These rules are non-negotiable.

### Step 3 — Requirement Traceability
Every file you create or modify must map to at least one requirement ID from REQUIREMENTS.md. Add a `// Satisfies: REQ-XXX` comment at the top of files where applicable.

### Step 4 — TypeScript Strict Mode
All TypeScript must pass `tsc --strict --noEmit`. No `any` types. No type assertions without a comment explaining why. Zod schemas are the single source of truth for runtime types.

### Step 5 — File and Function Size Limits
Files MUST be under 250 lines. Functions MUST be under 40 lines. If you exceed these limits, refactor before committing.

### Step 6 — Security by Default
- All external inputs validated with Zod (SEC-001)
- Secrets never in client bundle (SEC-002)
- No raw HTML rendering of LLM or user text (SEC-007)
- No user-supplied URLs in outbound requests (SEC-006)
- Prompt-injection defenses on all LLM calls (SEC-004)

### Step 7 — Catalog Grounding
The LLM MUST only select, order, and phrase actions from the curated catalog (`src/catalog/catalog.json`). It MUST NOT invent new actions (D6). Every generated plan references catalog action IDs. The output schema is validated with Zod.

### Step 8 — Impact Evidence Required
Every catalog action's impact field MUST have: `magnitudeRange`, `basis`, `confidence` ("high"|"medium"|"low"), `benefitType` ("personal_exposure"|"emissions"|"both"), and `sourceNote`. Build fails if any action is missing these fields (DATA-004).

### Step 9 — Deterministic Fallback
Every code path that calls an external provider (AQI, geocoding, LLM) MUST have a deterministic fallback. The app must be fully usable without any external call (REQ-010).

### Step 10 — Accessibility
All UI components MUST use semantic HTML, ARIA attributes, and design tokens. AQI is NEVER conveyed by color alone (A11Y-002). Forms have associated labels and error announcements (A11Y-003).

### Step 11 — No Server Persistence
No database writes. No server-side session storage. Coordinates are rounded to 2 decimal places before any use. Profile lives in localStorage only (DATA-001).

### Step 12 — Write Tests First (or Alongside)
Every pure-function module in `src/domain/` gets a co-located unit test. API routes get integration tests with MSW mocks. Domain core coverage target: 90%+ lines (TEST-001).

### Step 13 — Structured Logging
Use the structured logger (`src/lib/logger.ts`). Never log raw coordinates, free text, or API keys (SEC-009). Include request IDs on all logs.

### Step 14 — Update TRACEABILITY.md
When you create or modify a file, update the traceability entry in `docs/TRACEABILITY.md` mapping your file to its EC criteria and requirement IDs.

---

## Degradation Matrix

| Failure | Degradation | Implementation |
|---------|-------------|----------------|
| AQI provider down | Manual AQI entry + staleness warning | `src/lib/providers/aqi.ts` circuit breaker |
| LLM down/quota | Deterministic rule-engine plan (no narrative) | `src/domain/planner.ts` fallback |
| Geolocation denied | City search fallback | `src/lib/providers/geocoding.ts` |
| Offline | Cached last plan + offline indicator | Service worker + localStorage |
| Malicious free-text | Scoped Q&A + injection defenses | `src/lib/ai/guardrails.ts` |
| Region without data | Manual entry + "data unavailable" copy | AQI adapter error handling |

---

## Module Map

```
src/
  app/                    # Next.js App Router pages and API routes
    api/
      plan/route.ts       # POST /api/plan — plan generation
      aqi/route.ts        # GET /api/aqi — air quality proxy + cache
      geocode/route.ts    # GET /api/geocode — geocoding proxy
      followup/route.ts   # POST /api/followup — bounded Q&A
      health/route.ts     # GET /api/health — health check
  domain/                 # Pure functions — no I/O, no side effects
    profile.ts            # Profile schema + validation
    aqi-bands.ts          # AQI band table + escalation logic
    rules-engine.ts       # Plan assembly + budget filter + escalation
    impact-model.ts       # Exposure vs emissions, ranges, confidence
    community-calc.ts     # What-if community calculator
  lib/
    providers/
      aqi.ts              # AQI provider interface + Open-Meteo adapter
      geocoding.ts        # Geocoding provider interface + adapter
    ai/
      client.ts           # Gemini API client (server-only)
      planner.ts          # Plan prompt + structured output + validation
      guardrails.ts       # Prompt-injection defenses + Q&A scoping
    cache.ts              # LRU cache with TTL
    logger.ts             # Structured JSON logger with redaction
    config.ts             # 12-factor env validation (Zod)
    rate-limit.ts         # Per-client rate limiting
  catalog/
    catalog.json          # Curated action catalog
    catalog.schema.ts     # Zod schema (build-time guard)
  components/             # React UI components
    profile/              # Profile wizard
    plan/                 # Plan display (routine, hacks, alternatives)
    aqi/                  # AQI display widget
    community/            # What-if calculator UI
    shared/               # Design system components
  i18n/
    en.json               # English strings
    schema.ts             # i18n schema validation
tests/
  unit/                   # Domain core unit tests
  integration/            # API integration tests (MSW)
  e2e/                    # Playwright E2E
```

---

## AQI Band Table (US AQI + PM2.5 µg/m³)

| Band | AQI Range | PM2.5 (µg/m³) | Label | Escalation Level |
|------|-----------|----------------|-------|-----------------|
| 1 | 0–50 | 0–12 | Good | 0 |
| 2 | 51–100 | 12.1–35.4 | Moderate | 1 |
| 3 | 101–150 | 35.5–55.4 | Unhealthy for Sensitive Groups | 2 |
| 4 | 151–200 | 55.5–150.4 | Unhealthy | 3 |
| 5 | 201–300 | 150.5–250.4 | Very Unhealthy | 4 |
| 6 | 301–500 | 250.5–500 | Hazardous | 5 |
| 7 | 500+ | 500+ | Severe (winter smog) | 6 |
