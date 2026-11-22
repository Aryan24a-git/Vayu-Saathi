# AGENTS.md — Clear Air Companion Authoritative Agent Rules & Contract
> Version: 2.0.0 | Last updated: 2026-11-22
> Authoritative contract for all AI agents (V2-00 through V2-19).

---

## 1. Source of Truth Hierarchy (P1-P3)
1. **Repository state verified by direct inspection**
2. **Real command, test, and build execution output**
3. **Specification documents in `docs/`**
4. **`memory.md`**
5. **Any earlier AI claim (Never trust an earlier claim without verification)**

Evidence labels:
- `VERIFIED`: Inspected or executed directly with proof.
- `UNVERIFIED`: Believed, not yet checked.
- `BLOCKED`: Cannot proceed without external action.

Task states:
`UNKNOWN` > `INSPECTED` > `PLANNED` > `IMPLEMENTING` > `VALIDATING` > `VERIFIED`.
Never go `PLANNED` to `COMPLETE`.

---

## 2. Shared V2 Protocol (P1 to P14)
- **P1**: Read `memory.md`, then only the docs relevant to the task.
- **P2**: Inspect the real repo: tree, sources, config, deps, scripts, tests, API contracts, docs. Decide what exists, works, is partial, broken, or missing.
- **P3**: Reconcile: if `memory.md` disagrees with the repo, trust the repo and correct `memory.md` first.
- **P4**: State objective, requirement IDs, evaluation criteria, expected outputs, constraints, assumptions, risks, affected systems.
- **P5**: Change-impact analysis across UI, API, shared types, tests, config, docs, a11y, perf, observability. Update every layer together. Never silently break a consumer.
- **P6**: Write a short plan. Smallest correct change. No unrelated refactors.
- **P7**: Implement per docs (PRD, Tech Stack, Architecture, Security, Testing, Rules).
- **P8**: Quality check: correctness, code quality, security, accessibility, performance, reliability, observability, evaluation alignment.
- **P9**: Validate by RUNNING things: `npm run check` (format, lint, typecheck, tests) plus task-specific commands. Report Command / Result / Failures / Fixes / Remaining.
- **P10**: On failure: find root cause, fix, rerun. Never hide errors, disable tests/lint/type checks, weaken security, or fabricate success.
- **P11**: Manual gate: act autonomously first. Stop only for environment limitations. Never ask for secrets in chat or memory.
- **P12**: Definition of done: implementation exists, requirements satisfied, files exist, affected tests pass, static checks pass, docs synchronized.
- **P13**: Update `memory.md` with evidence-based state, changed files, decisions, and requirement statuses.
- **P14**: Return exactly one of: `COMPLETE` / `COMPLETE WITH WARNINGS` / `BLOCKED - MANUAL ACTION REQUIRED` / `BLOCKED - TECHNICAL ISSUE`.

---

## 3. Project Rules (Non-Negotiable)
1. **Files under 250 lines; functions under 40 lines** (NFR-004).
2. **TypeScript strict mode**: zero `any`, zero unannotated casts (EC-001).
3. **Domain rules D1–D6**:
   - D1: Protective escalation with AQI and vulnerability.
   - D2: Feasibility by budget and housing type.
   - D3: Do no harm (never recommend opening windows during peak smog or burning waste).
   - D4: Sourced impact evidence with ranges and confidence.
   - D5: No diagnosis or medical treatment.
   - D6: Catalog grounding: LLM only selects/phrases curated actions.
4. **Security by default**: Zod at every boundary, secrets server-only, SSRF allowlists, log redaction.
5. **Accessibility**: Semantic HTML, skip links, non-color AQI badges, form labels, WCAG 2.1 AA.
6. **Zero server persistence**: LocalStorage only for profiles, coordinates rounded to 2 decimal places.

---

## 4. Degradation Matrix
| Failure | Degradation | Implementation |
|---|---|---|
| AQI provider down | Manual AQI entry + fallback estimate | `src/lib/providers/aqi.ts` |
| LLM down or quota | Deterministic rules-engine plan | `src/lib/ai/planner.ts` |
| Geolocation denied | City search fallback | `src/lib/providers/geocoding.ts` |
| Offline | Cached last plan + offline indicator | Local storage / Service worker |
| Malicious free-text | Scoped Q&A + injection detection | `src/lib/ai/guardrails.ts` |
