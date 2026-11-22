# TRACEABILITY.md — Clear Air Companion

> Maps Evaluation Criteria → Requirements → Implementation Files.
> Fully updated with verified status.

## Evaluation Criteria Coverage

### EC-001: Code Quality (High)

| Requirement | Implementation File | Status |
|-------------|-------------------|--------|
| NFR-001: Modular monolith | `src/domain/`, `src/lib/`, `src/app/api/` | VERIFIED |
| NFR-004: Strict TS, file size limits (<250 lines) | `tsconfig.json`, all files verified | VERIFIED |
| REQ-013: i18n-ready strings | `src/i18n/en.json` | VERIFIED |

### EC-002: Problem Alignment (High)

| Requirement | Implementation File | Status |
|-------------|-------------------|--------|
| REQ-004: Daily routine by time-of-day | `src/domain/rules-engine.ts`, `src/components/plan/PlanCard.tsx` | VERIFIED |
| REQ-005: Indoor hacks | `src/domain/rules-engine.ts`, `src/catalog/catalog.json` | VERIFIED |
| REQ-006: Sustainable alternatives | `src/domain/rules-engine.ts`, `src/catalog/catalog.json` | VERIFIED |
| REQ-007: Impact with range+basis | `src/domain/impact-model.ts`, `src/components/plan/PlanCard.tsx` | VERIFIED |
| REQ-009: Grounded LLM narrative | `src/lib/ai/planner.ts`, `src/lib/ai/guardrails.ts` | VERIFIED |
| REQ-010: Deterministic fallback | `src/domain/rules-engine.ts`, `src/lib/ai/planner.ts` | VERIFIED |
| REQ-011: Bounded Q&A | `src/lib/ai/guardrails.ts`, `src/app/api/followup/route.ts` | VERIFIED |
| REQ-012: Share + print | `src/components/plan/PlanCard.tsx` | VERIFIED |
| REQ-016: Community what-if calculator | `src/domain/community-calc.ts`, `src/components/community/CommunityCalculator.tsx` | VERIFIED |

### EC-003: Security (Medium)

| Requirement | Implementation File | Status |
|-------------|-------------------|--------|
| SEC-001: Zod validation | `src/domain/profile.ts`, all `src/app/api/*/route.ts` | VERIFIED |
| SEC-002: Server-only secrets | `src/lib/config.ts`, `src/lib/ai/client.ts` | VERIFIED |
| SEC-003: Rate limiting | `src/lib/rate-limit.ts` (all API routes guarded) | VERIFIED |
| SEC-004: Prompt injection defenses | `src/lib/ai/guardrails.ts` | VERIFIED |
| SEC-005: Security headers | `next.config.mjs` | VERIFIED |
| SEC-006: SSRF guard | `src/lib/providers/aqi.ts`, `src/lib/providers/geocoding.ts` | VERIFIED |
| SEC-007: No raw HTML rendering | React default escaping, no dangerouslySetInnerHTML | VERIFIED |
| SEC-009: Log redaction | `src/lib/logger.ts` | VERIFIED |

### EC-004: Efficiency (Medium)

| Requirement | Implementation File | Status |
|-------------|-------------------|--------|
| PERF-001: JS budget (<150KB gzip) | `next build` report: 118 kB First Load JS | VERIFIED |
| PERF-002: AQI cache (TTL 15 min, coalesced) | `src/lib/cache.ts`, `src/lib/providers/aqi.ts` | VERIFIED |
| PERF-003: Grounded single LLM call | `src/lib/ai/planner.ts` | VERIFIED |
| PERF-004: LRU memory bounds | `src/lib/cache.ts` | VERIFIED |

### EC-005: Testing (Low)

| Requirement | Implementation File | Status |
|-------------|-------------------|--------|
| TEST-001: Domain 90%+ coverage | `tests/unit/` (Achieved: 99.08% lines) | VERIFIED |
| TEST-005: AI guardrail tests | `tests/unit/ai-guardrails.test.ts` | VERIFIED |

### EC-006: Accessibility (Low)

| Requirement | Implementation File | Status |
|-------------|-------------------|--------|
| A11Y-001: Semantic HTML & Skip link | `src/app/layout.tsx`, `src/components/shared/Header.tsx` | VERIFIED |
| A11Y-002: AQI not color-only | `src/components/aqi/AqiBadge.tsx` (icons + badges + values) | VERIFIED |
| A11Y-003: Form labels & inputs | `src/components/profile/ProfileWizard.tsx` | VERIFIED |
| A11Y-004: Live regions & alerts | `src/components/plan/PlanCard.tsx`, `src/app/page.tsx` | VERIFIED |
| A11Y-006: Plain language copy | `src/i18n/en.json`, all UI components | VERIFIED |

## File → Requirement Index

| Source File | Satisfies |
|------------|----------|
| `src/domain/profile.ts` | REQ-002, SEC-001, DATA-001, DATA-002 |
| `src/domain/aqi-bands.ts` | REQ-003, REQ-004, REQ-008, D1 |
| `src/domain/rules-engine.ts` | REQ-004, REQ-005, REQ-006, REQ-010, D1, D2, D3 |
| `src/domain/impact-model.ts` | REQ-007, D4, DATA-004 |
| `src/domain/community-calc.ts` | REQ-016, D4 |
| `src/lib/providers/aqi.ts` | REQ-003, REL-001, REL-002, SEC-006, PERF-002, DATA-001 |
| `src/lib/providers/geocoding.ts` | REQ-001, SEC-006 |
| `src/lib/ai/client.ts` | REQ-009, SEC-002, REL-001 |
| `src/lib/ai/planner.ts` | REQ-009, REQ-010, SEC-004, PERF-003, D6 |
| `src/lib/ai/guardrails.ts` | REQ-011, SEC-004, D6 |
| `src/lib/cache.ts` | PERF-002, PERF-003, PERF-004 |
| `src/lib/logger.ts` | OBS-001, OBS-002, SEC-009 |
| `src/lib/config.ts` | NFR-003, SEC-002, DEP-003 |
| `src/lib/rate-limit.ts` | SEC-003 |
| `src/catalog/catalog.json` | REQ-004, REQ-005, REQ-006, REQ-007, D6, DATA-004 |
| `src/catalog/catalog.schema.ts` | DATA-004 |
| `src/catalog/validate-catalog.ts` | DATA-004 |
| `src/i18n/en.json` | REQ-013, A11Y-006 |
| `src/app/api/aqi/route.ts` | REQ-003, SEC-001, SEC-003 |
| `src/app/api/geocode/route.ts` | REQ-001, SEC-001, SEC-003 |
| `src/app/api/plan/route.ts` | REQ-004, REQ-005, REQ-007, REQ-009, REQ-010, SEC-001, SEC-003 |
| `src/app/api/followup/route.ts` | REQ-011, SEC-001, SEC-003, SEC-004, D5 |
| `src/app/api/health/route.ts` | REL-003 |
| `src/components/aqi/AqiBadge.tsx` | REQ-001, REQ-003, A11Y-002 |
| `src/components/profile/ProfileWizard.tsx` | REQ-002, DATA-001, DATA-002, A11Y-003 |
| `src/components/plan/PlanCard.tsx` | REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-012 |
| `src/components/community/CommunityCalculator.tsx` | REQ-016, D4 |
| `src/components/plan/FollowUpChat.tsx` | REQ-011, SEC-004, A11Y-004 |
| `src/app/page.tsx` | REQ-001, REQ-002, REQ-003, REQ-004, REQ-010, REQ-015 |
| `src/app/layout.tsx` | A11Y-001, EC-006 |
