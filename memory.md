# MEMORY.md — Clear Air Companion Master State

> Version: 4.0.0 | Stage: V2-25 (Final Engineering Audit Redo) | Last updated: 2026-11-24
> Authority: P1–P14 Shared V2 Protocol | AGENTS.md § 1–4 | Phase 5 Audit Protocol

---

## 1. Project Summary

- **Title**: Clear Air Companion (VayuSaathi)
- **Goal**: GenAI decision support assistant for families and communities navigating severe winter smog.
- **Core Verbs**: Suggest (routines, hacks, alternatives) · Tailor (live AQI, household profile) · Explain (impact with honest uncertainty).
- **Evaluation Priority**: EC-001 (High), EC-002 (High), EC-003 (Medium), EC-004 (Medium), EC-005 (Low), EC-006 (Low).

---

## 2. Current State & Phase

- **Current Phase**: Stage V2-25 (Final Engineering Audit Redo) — **COMPLETE**
- **Authoritative Gate Verdict**: **`NOT PRODUCTION READY`**
- **Strict Phase 5 Justification**:
  1. **Security Gate Blocker**: `npm audit` reports 15 open advisories (4 Critical, 6 High, 5 Moderate), including open HIGH advisories in `zod@3.25.76` and `next@14.2.35`. Per the Phase 5 gate: *"Release-blocking if: Open CRITICAL/HIGH, secret in repo or bundle"*. The rule forbids qualifying this condition to "in app code only", and protocol P10 forbids severity downgrades. Because a warning can *never* cover open HIGH or CRITICAL findings, production clearance is blocked.
  2. **Deployment Gate Blocker**: Per task rules, Docker CLI is unavailable on the Windows host (`docker: The term 'docker' is not recognized`). `DEP-001` (Docker container build and run) and `DEP-004` (rollback rehearsal) stay **UNVERIFIED**.
  3. **Live Key Checkpoint**: `GEMINI_API_KEY` is not present in the environment; `REQ-009` and `REQ-013` operate in verified, honest Basic Mode, with live key execution marked **UNVERIFIED**.
- **Quality Gates (VERIFIED)**:
  - `npm run check`: **PASS (0 format, 0 lint, 0 type errors, 0 dead files, 0 circular imports)**
  - Unit & Integration: **PASS (131 / 131 tests passing across 29 test files in 10.91s)**
  - Domain Coverage: **PASS (93.71% line coverage in domain core, 95.68% overall, exceeding 90% target)**
  - Standalone Build: **PASS (`next build && node scripts/copy-assets.mjs` completed cleanly)**
  - First Load JS: **PASS (`/`: 116 kB, `/plan`: 118 kB, `/ask`: 90.1 kB vs ≤ 150 kB budget)**
  - Production Smoke: **PASS (8 / 8 checks passing via `node scripts/smoke.mjs` against standalone server on port 3000)**
  - Secret Scanning: **PASS (Zero API keys or secrets in source or client bundles)**

---

## 3. Source of Truth Hierarchy

1. Repository state verified by direct inspection
2. Real command, test, and build execution output
3. Specification documents in `docs/`
4. `memory.md`
5. Any earlier AI claim (Never trust without verification)

---

## 4. Architectural Invariants

1. **Modular Monolith**: Next.js 14 App Router, standalone distribution, no microservices, no message queues, no external DB.
2. **Pure Domain Core**: `src/domain/` contains zero side effects, zero I/O, 100% deterministic pure functions.
3. **Curated Catalog Grounding**: LLM is strictly prohibited from inventing advice; selects only from `src/catalog/catalog.json` (D6).
4. **Deterministic Fallback**: Core application fully usable without LLM or AQI provider (REQ-010).
5. **No Server Persistence**: Profile stored exclusively in browser `localStorage`. Coordinates rounded to 2 decimal places (~1.1 km precision).
6. **Code Constraints**: Files strictly under 250 lines, functions under 40 lines (NFR-004).

---

## 5. Master Requirements Recomputed Status (All 25 IDs)

### Critical Requirements (17 IDs — Includes REL-002)

| Requirement ID | Summary | Priority | Status |
|---|---|---|---|
| `REQ-001` | Location input paths (geocode, coords, manual) | **Critical** | **VERIFIED** |
| `REQ-002` | Household profile schema v1/v2 with vulnerabilities | **Critical** | **VERIFIED** |
| `REQ-003` | Live and forecast air quality from Open-Meteo | **Critical** | **VERIFIED** |
| `REQ-004` | Daily low-emission routine escalating with AQI | **Critical** | **VERIFIED** |
| `REQ-005` | Indoor air hacks tailored to housing & budget | **Critical** | **VERIFIED** |
| `REQ-007` | Direct impact explanation with ranges & sources | **Critical** | **VERIFIED** |
| `REQ-008` | Sensitive-group safety & medical red-flag copy | **Critical** | **VERIFIED** |
| `REQ-009` | Grounded GenAI narrative | **Critical** | **VERIFIED (fixtures/Basic Mode), live UNVERIFIED** |
| `REQ-010` | Deterministic fallback plan (100% no-key mode) | **Critical** | **VERIFIED** |
| `SEC-001` | Zod validation at all HTTP boundaries | **Critical** | **VERIFIED** |
| `SEC-002` | Secrets server-only; zero client bundle leaks | **Critical** | **VERIFIED** |
| `SEC-004` | Prompt-injection defenses & adversarial refusal | **Critical** | **VERIFIED** |
| `SEC-007` | Zero `dangerouslySetInnerHTML` rendering | **Critical** | **VERIFIED** |
| `REL-002` | Degradation matrix honored across all failures | **Critical** | **VERIFIED** |
| `DATA-001`| Data minimization: coords rounded to 2dp (~1 km)| **Critical** | **VERIFIED** |
| `DATA-004`| Sourced impact figures for all catalog entries | **Critical** | **VERIFIED** |
| `EC-001`  | Code quality: modular monolith, strict TS, size | **Critical** | **VERIFIED** |

### Non-Critical Requirements (8 IDs)

| Requirement ID | Summary | Priority | Status |
|---|---|---|---|
| `REQ-006` | Emission swaps with vehicle & cooking factors | High | **VERIFIED** |
| `REQ-011` | Bounded Q&A with injection defense & refusal | High | **VERIFIED** |
| `REQ-012` | Community colony impact simulation | Medium | **VERIFIED** |
| `REQ-013` | Multimodal photo IAQ room audit | High | **VERIFIED (Basic Mode), live UNVERIFIED** |
| `REQ-014` | 24-hour diurnal dispersion curve & window | High | **VERIFIED** |
| `REQ-015` | Zero server persistence (LocalStorage only) | High | **VERIFIED** |
| `REQ-016` | 1-tap bilingual WhatsApp advisory bulletin | Medium | **VERIFIED** |
| `DEP-001` | Multi-stage Docker container build & run | High | **UNVERIFIED (Host lacks Docker)** |
| `DEP-004` | Container rollback rehearsal | Medium | **UNVERIFIED (Host lacks Docker)** |

---

## 6. Runtime & Pinned Dependency Versions (VERIFIED)

| Package / Runtime      | Pinned Version                  | Verification Method      | Status   |
| ---------------------- | ------------------------------- | ------------------------ | -------- |
| Node.js                | v24.11.1                        | `node -v`                | VERIFIED |
| npm                    | 11.6.2                          | `npm -v`                 | VERIFIED |
| Next.js                | 14.2.35                         | `package.json` / build   | VERIFIED |
| React                  | 18.3.1                          | `package.json` / runtime | VERIFIED |
| React-DOM              | 18.3.1                          | `package.json` / runtime | VERIFIED |
| TypeScript             | 5.6.3                           | `tsc --version`          | VERIFIED |
| Zod                    | 3.25.76                         | `package.json` / tests   | VERIFIED |
| Vitest                 | 2.1.9                           | `vitest --version`       | VERIFIED |
| @vitest/coverage-v8    | 2.1.9                           | `vitest run --coverage`  | VERIFIED |
| ESLint                 | 8.57.1                          | `next lint`              | VERIFIED |
| Prettier               | 3.3.3                           | `prettier --version`     | VERIFIED |
| Tailwind CSS           | 3.4.15                          | `package.json`           | VERIFIED |
| Lucide React           | 0.454.0                         | `package.json`           | VERIFIED |
| Gemini API REST Client | Custom fetch in `geminiClient`  | `src/server/llm/`        | VERIFIED |
| Logger                 | Custom zero-dep redacted logger | `src/lib/logger.ts`      | VERIFIED |

---

## 7. Key Architectural Decisions (ADRs)

- **ADR-001**: Next.js 14 App Router for API route colocation and zero client-bundle secret leaks.
- **ADR-002**: LocalStorage only for household profiles and community pinboard (zero server databases).
- **ADR-003**: In-memory LRU cache with TTL for AQI and geocoding responses.
- **ADR-004**: Adopt Gemini 1.5 Flash as the single GenAI provider (superseding Anthropic per CR 24 Nov 2026) for both grounded text rephrasing and multimodal visual inspection. All calls remain strictly server-side through `src/server/llm/client.ts` with server-only `GEMINI_API_KEY` and zero browser key exposure.
- **ADR-005**: Cross-platform asset distribution via `scripts/copy-assets.mjs` wired to `npm run build`, ensuring reproducible standalone execution on Windows, Linux, and Docker.

---

## 8. Path to Clear Blockers to `PRODUCTION READY`

1. **Dependency Upgrade (Security Blocker)**: Upgrade `next` to `^15.3.0` and `zod` to `^4.6.7` once backward-compatible migrations are validated, confirming `npm audit --audit-level=high` reports 0 open CRITICAL/HIGH vulnerabilities.
2. **Container Host Verification (Deployment Blocker)**: Execute `docker build`, `docker run`, and container rollback on a runner with Docker daemon installed.
3. **Provision Gemini Secret**: Set `GEMINI_API_KEY` in deployment environment secret manager to transition live LLM items from Basic Mode to fully verified live execution.
4. **Human Accessibility Walkthrough**: Conduct human screen-reader testing (NVDA / VoiceOver).
