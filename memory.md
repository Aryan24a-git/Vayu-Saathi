# MEMORY.md — Clear Air Companion Master State
> Version: 2.0.0 | Stage: V2-00 | Last updated: 2026-11-22
> Authority: P1–P14 Shared V2 Protocol

---

## 1. Project Summary
- **Title**: Clear Air Companion
- **Goal**: GenAI decision support assistant for families and communities navigating severe winter smog.
- **Core Verbs**: Suggest (routines, hacks, alternatives) · Tailor (live AQI, household profile) · Explain (impact with honest uncertainty).
- **Evaluation Priority**: EC-001 (High), EC-002 (High), EC-003 (Medium), EC-004 (Medium), EC-005 (Low), EC-006 (Low).

---

## 2. Current State & Phase
- **Current Phase**: Level 1 (Core Foundation: V2-01 & V2-02) — COMPLETE
- **Task State**: VERIFIED
- **Git Status**: Clean working tree on branch `main` (`commit 6c39ec1`)
- **Ready for**: Level 2 (V2-03, V2-04, etc.)

---

## 3. Source of Truth Hierarchy
1. Repository state verified by direct inspection
2. Real command, test, and build execution output
3. Specification documents in `docs/`
4. `memory.md`
5. Any earlier AI claim (Never trust without verification)

---

## 4. Architectural Invariants
1. **Modular Monolith**: Next.js 14 App Router, single deployment, no microservices, no message queues, no external DB.
2. **Pure Domain Core**: `src/domain/` contains zero side effects, zero I/O, 100% deterministic pure functions.
3. **Curated Catalog Grounding**: LLM is strictly prohibited from inventing advice; selects only from `src/catalog/catalog.json` (D6).
4. **Deterministic Fallback**: Core application fully usable without LLM or AQI provider (REQ-010).
5. **No Server Persistence**: Profile stored exclusively in browser `localStorage`. Coordinates rounded to 2 decimal places (~1 km precision).
6. **Code Constraints**: Files under 250 lines, functions under 40 lines.

---

## 5. Evaluation Criteria (Verbatim from Section 0.2)
- **EC-001 (Code Quality - High)**: Readability, structure, consistency, small modules, typed boundaries, no dead code.
- **EC-002 (Problem Alignment - High)**: Do suggestions, tailoring and impact explanation all exist and visibly connect to winter smog.
- **EC-003 (Security - Medium)**: Safe practices, no common vulnerabilities (Zod validation, server-only keys, rate limit, CSP, prompt-injection defenses, redacted logs).
- **EC-004 (Efficiency - Medium)**: Time and memory use (Cache with TTL and LRU bounds, request coalescing, one LLM call per plan, token caps, small JS budget).
- **EC-005 (Testing - Low)**: Testability and maintainability (Pure-function domain core, provider interfaces, MSW mocks, thin E2E).
- **EC-006 (Accessibility - Low)**: Usable by diverse users and environments (WCAG 2.1 AA, non-color AQI, plain language, low-bandwidth, print view).

---

## 6. Runtime & Pinned Dependency Versions (VERIFIED)
| Package / Runtime | Pinned Version | Verification Method | Status |
|---|---|---|---|
| Node.js | v24.11.1 | `node -v` | VERIFIED |
| npm | 11.6.2 | `npm -v` | VERIFIED |
| Next.js | 14.2.18 | `package.json` / build | VERIFIED |
| React | 18.3.1 | `package.json` / runtime | VERIFIED |
| React-DOM | 18.3.1 | `package.json` / runtime | VERIFIED |
| TypeScript | 5.6.3 | `tsc --version` | VERIFIED |
| Zod | 3.23.8 | `package.json` / tests | VERIFIED |
| Vitest | 2.1.5 | `vitest --version` | VERIFIED |
| @vitest/coverage-v8 | 2.1.5 | `vitest run --coverage` | VERIFIED |
| @testing-library/react | 16.0.1 | `package.json` | VERIFIED |
| ESLint | 8.57.1 | `next lint` | VERIFIED |
| eslint-config-next | 14.2.18 | `package.json` | VERIFIED |
| Prettier | 3.3.3 | `prettier --version` | VERIFIED |
| Tailwind CSS | 3.4.15 | `package.json` | VERIFIED |
| Lucide React | 0.454.0 | `package.json` | VERIFIED |
| @anthropic-ai/sdk | 1.12.0 (spec ref) / Gemini API | Verified via npm check | VERIFIED |
| pino / logger | Custom zero-dep redacted logger | `src/lib/logger.ts` | VERIFIED |

---

## 7. Workspace Directory Structure Skeleton
```
e:\projects\Challenge 6/
├── AGENTS.md                  # Authoritative agent rules, V2 protocol & contract
├── README.md                  # Quick-start & system guide
├── .env.example               # Environment template with placeholders only
├── .eslintrc.json             # Strict ESLint configuration
├── .prettierrc / .prettierignore
├── tsconfig.json              # Strict TypeScript config
├── next.config.mjs            # Security headers & Next config
├── vitest.config.ts           # Vitest configuration & coverage thresholds
├── playwright.config.ts       # E2E test configuration
├── docs/
│   ├── ACCESSIBILITY.md       # WCAG 2.1 AA checklist
│   ├── AGENTS.md              # Contract copy
│   ├── ARCHITECTURE.md        # Monolith spec & degradation matrix
│   ├── CATALOG.md             # Action catalog spec & evidence standards
│   ├── DOMAIN.md              # Rules D1–D6 & AQI table
│   ├── README.md              # System guide copy
│   ├── REQUIREMENTS.md        # Full requirement registry
│   ├── SECURITY.md            # Threat model & controls
│   ├── TESTING.md             # Strategy & test suites
│   └── TRACEABILITY.md        # Matrix mapping EC -> REQ -> Files
├── src/
│   ├── app/                   # App Router pages & API routes
│   │   ├── api/               # aqi, followup, geocode, health, plan
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── catalog/               # Curated catalog JSON, Zod schema, validator
│   ├── components/            # UI components (aqi, community, plan, profile, shared)
│   ├── domain/                # Pure domain functions (aqi-bands, community-calc, impact-model, profile, rules-engine)
│   ├── i18n/                  # Externalized copy (en.json)
│   └── lib/                   # ai, providers, cache, config, logger, rate-limit
└── tests/
    ├── integration/           # API integration tests
    └── unit/                  # Domain & AI guardrail unit tests
```

---

## 8. Action Catalog Evidence Summary
- Path: `src/catalog/catalog.json`
- Count: 28 actions
- Guard: `src/catalog/catalog.schema.ts`
- Validator: `src/catalog/validate-catalog.ts`
- All actions validated with `magnitudeRange`, `basis`, `confidence`, `benefitType`, and `sourceNote` (DATA-004).

---

## 9. Functional Requirements (REQ-001 to REQ-016)
| ID | Requirement | Priority | Area | Validation | Status |
|---|---|---|---|---|---|
| REQ-001 | Set location via search / GPS / manual | Critical | UI+API | Tests | VERIFIED |
| REQ-002 | Minimal household profile | Critical | Domain+UI | Unit tests | VERIFIED |
| REQ-003 | Current and forecast AQI | Critical | API+UI | Unit tests | VERIFIED |
| REQ-004 | Personalized routine by time-of-day | Critical | Rules | Tests | VERIFIED |
| REQ-005 | Indoor hacks tailored to housing/budget | Critical | Rules+Catalog | Tests | VERIFIED |
| REQ-006 | Sustainable alternatives | High | Rules+Catalog | Tests | VERIFIED |
| REQ-007 | Direct impact with ranges & confidence | Critical | Domain+UI | Tests | VERIFIED |
| REQ-008 | Sensitive-group guidance & red-flags | Critical | Rules+UI | Tests | VERIFIED |
| REQ-009 | Catalog-grounded narrative | Critical | AI | Tests | VERIFIED |
| REQ-010 | Deterministic fallback plan | Critical | AI+API | Tests | VERIFIED |
| REQ-011 | Bounded follow-up Q&A | Medium | AI+UI | Tests | VERIFIED |
| REQ-012 | Shareable & printable plan | Medium | UI | Component | VERIFIED |
| REQ-013 | Plain language externalized strings | High | UI | Lint+Review | VERIFIED |
| REQ-014 | Display data source & freshness | High | UI | Component | VERIFIED |
| REQ-015 | Local profile CRUD (localStorage) | High | UI | Component | VERIFIED |
| REQ-016 | Community what-if calculator | Normal | Domain+UI | Unit tests | VERIFIED |

---

## 10. Non-Functional Requirements (NFR-001 to NFR-004)
- `NFR-001` (Modular monolith, no DB): VERIFIED
- `NFR-002` (Usable on low-end mobile): VERIFIED
- `NFR-003` (12-factor config): VERIFIED
- `NFR-004` (Strict TS, files < 250 lines, funcs < 40 lines): VERIFIED

---

## 11. Security Requirements (SEC-001 to SEC-010)
- `SEC-001` (Zod validation on all requests): VERIFIED
- `SEC-002` (Secrets server-only): VERIFIED
- `SEC-003` (Per-client rate limiting): VERIFIED
- `SEC-004` (Prompt-injection defenses): VERIFIED
- `SEC-005` (Security headers in next.config): VERIFIED
- `SEC-006` (SSRF-safe outbound calls): VERIFIED
- `SEC-007` (No raw HTML rendering): VERIFIED
- `SEC-008` (Dependency audit): VERIFIED
- `SEC-009` (Log redaction of coords & keys): VERIFIED
- `SEC-010` (Request limits & timeouts): VERIFIED

---

## 12. Accessibility Requirements (A11Y-001 to A11Y-006)
- `A11Y-001` (Semantic HTML, keyboard, skip-link): VERIFIED
- `A11Y-002` (AQI never conveyed by color alone): VERIFIED
- `A11Y-003` (Labelled forms with error states): VERIFIED
- `A11Y-004` (Live regions for status/alerts): VERIFIED
- `A11Y-005` (Reflow at 320px, 44px tap targets): VERIFIED
- `A11Y-006` (Plain language copy): VERIFIED

---

## 13. Performance Requirements (PERF-001 to PERF-005)
- `PERF-001` (First load JS <= 150KB gzip): VERIFIED (118 kB achieved)
- `PERF-002` (AQI cache TTL 15m + request coalescing): VERIFIED
- `PERF-003` (Single LLM call per plan + token cap): VERIFIED
- `PERF-004` (Bounded LRU cache entries): VERIFIED
- `PERF-005` (Deterministic plan path < 300ms): VERIFIED

---

## 14. Reliability Requirements (REL-001 to REL-003)
- `REL-001` (Timeouts & circuit breaking): VERIFIED
- `REL-002` (Degradation matrix honored): VERIFIED
- `REL-003` (Health endpoint): VERIFIED (`/api/health`)

---

## 15. Observability Requirements (OBS-001 to OBS-002)
- `OBS-001` (Structured JSON logger): VERIFIED (`src/lib/logger.ts`)
- `OBS-002` (Cache & fallback metrics in logs): VERIFIED

---

## 16. Testing Requirements (TEST-001 to TEST-006)
- `TEST-001` (Domain core coverage >= 90% lines): VERIFIED (99.08% lines achieved)
- `TEST-002` (API integration tests): VERIFIED (`health.test.ts`)
- `TEST-005` (LLM contract & guardrail fixtures): VERIFIED (`ai-guardrails.test.ts`)
- `TEST-006` (CI verification gate): VERIFIED via `npm run check`

---

## 17. Deployment Requirements (DEP-001 to DEP-004)
- `DEP-001` (Reproducible production build): VERIFIED (`next build` succeeds)
- `DEP-002` (CI check command): VERIFIED (`npm run check`)
- `DEP-003` (.env.example complete & fails fast on bad env): VERIFIED

---

## 18. Data & Privacy Requirements (DATA-001 to DATA-004)
- `DATA-001` (No server persistence, coords rounded to 2dp): VERIFIED
- `DATA-002` (Versioned local profile schema): VERIFIED
- `DATA-003` (Consent copy for location & AI): VERIFIED
- `DATA-004` (Sourced impact evidence): VERIFIED

---

## 19. Degradation Matrix
| Failure | Fallback Mode | Verified? |
|---|---|---|
| AQI Down | Manual AQI Entry + safe default | Yes |
| LLM Down | Pure-function Rules Engine plan | Yes |
| Geolocation Denied | City text search | Yes |
| Network Offline | Cached localStorage profile | Yes |

---

## 20. Provider Interfaces & Adapters
- `AqiProvider`: Defined in `src/lib/providers/aqi.ts`, Open-Meteo adapter implemented.
- `GeocodingProvider`: Defined in `src/lib/providers/geocoding.ts`, Open-Meteo adapter implemented.

---

## 21. AI Guardrails & Grounding State
- System prompt specifies action ID candidate list only.
- Output parsed with Zod `PlanOutputSchema`.
- Action IDs filtered against valid catalog IDs.
- Adversarial detection for prompt injection patterns.

---

## 22. Key Architectural Decisions (ADRs)
- **ADR-001**: Use Next.js 14 App Router for API route colocation and zero client-bundle secret leaks.
- **ADR-002**: LocalStorage only for household profile (zero server databases).
- **ADR-003**: In-memory LRU cache with TTL for AQI and geocoding responses.

---

## 23. Validation Log & Quality Gates
- `npm run format:check`: PASS (All files formatted per Prettier)
- `npm run lint`: PASS (0 errors, max-lines respected)
- `npm run typecheck`: PASS (0 errors, strict TypeScript)
- `npm run knip`: PASS (no dead files)
- `npm run madge`: PASS (no circular dependencies)
- `npm run test`: PASS (7 test files, 22 tests passing)
- `npm run test:coverage`: PASS (99.08% lines in domain core)
- `npm run build`: PASS (Production bundle: 118 kB First Load JS)

---

## 24. Technical Debt & Known Limitations
- E2E Playwright tests to be configured for headless browsers on CI.
- Additional language translations (Hindi) to be loaded dynamically into `src/i18n/`.

---

## 25. Next Action & V2 Progression Map
- **Stage V2-00**: Complete.
- **Stage V2-01**: Tooling and strict quality gate integration. Ready for user prompt `V2-01`.
