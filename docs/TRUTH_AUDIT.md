# TRUTH_AUDIT.md — Authoritative Feature Truth Table & Integrity Audit
> Version: 1.0.0 | Date: 2026-11-24 | Authority: Source of Truth Hierarchy & CR-02 Protocol
> Standard: Zero faked features, zero misleading labels, zero silent synthetic degradation.

---

## 1. Feature Truth Table

| Feature | Implementation File(s) | Kind | LLM Called? | Behavior on Failure | Test Proving It | Exact UI Wording |
|---|---|---|---|---|---|---|
| **Live City Search** | `src/server/api/geocode.ts`, `src/server/providers/geocoding.ts` | REAL external call (Open-Meteo Geocoding) | No | Returns typed `PROVIDER_UNAVAILABLE` (502) or 404 | `tests/unit/server-http.test.ts` | "Search Indian city..." |
| **Air Data & Freshness** | `src/server/api/airQuality.ts`, `src/server/api/cityScenario.ts` | REAL external call (Open-Meteo Air Quality) | No | Returns 502/503 with manual AQI prompt; never silent defaults | `tests/unit/api-city-scenario.test.ts`, `tests/integration/api-security.test.ts` | "Model-derived NAQI equivalent (Open-Meteo)" + timestamp |
| **CPCB NAQI Calculation** | `src/domain/naqi.ts` | DETERMINISTIC pure function | No | Non-finite inputs throw `TypeError` / return `INVALID_INPUT` error | `tests/unit/naqi.test.ts` | "CPCB NAQI", dominant pollutant label, color-coded band |
| **Ventilation Window** | `src/domain/ventilation.ts`, `src/domain/naqi.ts` | DETERMINISTIC diurnal heuristic | No | Series < 24h returns `INSUFFICIENT_DATA`; post-16:00 projects tomorrow | `tests/unit/ventilation.test.ts`, `tests/unit/naqi.test.ts` | "Optimal Safe Ventilation: {windowLabel}" |
| **Diurnal Dispersion Curve** | `src/features/hero/DispersionChart.tsx`, `chartCoordinates.ts` | DETERMINISTIC pure SVG | No | Fallback to accessible table | `tests/unit/plan-ui.test.tsx`, Playwright Axe suite | "24-Hour Thermal Inversion & Ventilation Curve" |
| **Playbook & Actions** | `src/domain/catalog/`, `src/domain/rules/`, `src/server/api/playbook.ts` | DETERMINISTIC catalog rules engine | No | Rules engine fallback; only curated actions selected | `tests/unit/rules.test.ts`, `tests/unit/catalog.test.ts` | "Daily Anti-Smog Playbook", "Indoor Hacks", "Emission Swaps" |
| **AI Personalization** | `src/server/llm/narrate.ts`, `src/app/api/plan/narrate/route.ts` | REAL server LLM call (when key present) | Yes (`GEMINI_MODEL`, default `gemini-3.8-flash`) | Falls back to deterministic catalog titles & explainers | `tests/unit/llm-grounding.test.ts` | Header `"AI on"` / `"Basic mode"` badge from `/api/ready` |
| **Copilot Chat** | `src/server/llm/ask.ts`, `src/app/api/ask/route.ts` | REAL server LLM call (when key present) | Yes (`GEMINI_MODEL`, default `gemini-3.8-flash`) | Falls back to deterministic scope-matched templates; 404 logs once & flips `/api/ready` `llm: false` | `tests/unit/ai-guardrails.test.ts`, `tests/unit/llm-model-fallback.test.ts` | "Ask about school commute, DIY filters..." |
| **Photo IAQ Audit** | `src/server/api/audit.ts`, `src/features/copilot/MultimodalAudit.tsx` | REAL Gemini Vision (when key present) or DETERMINISTIC Checklist | Yes (if key present); No (Basic mode) | Basic mode returns tailored physical checklist; honest badge shown | `tests/unit/api-audit.test.ts` | "Tailored checklist for {focusArea}. Photo was not analysed by vision AI." / "Gemini Multimodal Vision" |
| **WhatsApp RWA Bulletin** | `src/server/api/bulletin.ts`, `src/features/community/WhatsAppGenerator.tsx` | DETERMINISTIC template with optional Gemini polish | Optional | Deterministic factual template in English or Hindi | `tests/unit/api-bulletin.test.ts` | "1-Tap WhatsApp RWA Bulletin", "Generate with AI" |
| **Colony Simulator** | `src/domain/emissions.ts`, `src/features/community/ColonySimulator.tsx` | DETERMINISTIC mathematical model | No | Clamped to [1, 10000] families and [1, 7] days | `tests/unit/emissions.test.ts`, `tests/unit/community.test.ts` | "Colony What-If Smog Reduction Simulator", "Rough estimate" |
| **Pledges & Impact Meter** | `src/domain/community.ts`, `src/features/playbook/ImpactMeter.tsx` | DETERMINISTIC browser state | No | Zero values on empty selection | `tests/unit/community.test.ts` | "Your Pledged Impact Today", "Rough estimate" |
| **Smog Pinboard** | `src/features/community/SmogPinboard.tsx`, `hotspotTypes.ts` | DETERMINISTIC device-local `localStorage` | No | Stored on browser only; zero fake seed items | `tests/unit/community.test.ts` | "Device-Local Smog Watch Pinboard — Saved on this device only" |
| **Household Profile Drawer** | `src/domain/profile.ts`, `src/features/profile/ProfileDrawer.tsx` | DETERMINISTIC schema-validated state | No | Invalid schemas migrated or reset to safe defaults | `tests/unit/profile.test.ts` | "60-Second Household Profile — Saved locally in your browser" |
| **Clear My Data** | `src/features/layout/useVayuSaathi.ts`, `src/app/page.tsx` | DETERMINISTIC `localStorage.clear()` | No | Immediate in-memory re-initialization | E2E journey test | "Clear all stored data from this browser" |
| **Offline View** | `src/components/shared/ServiceWorker.tsx`, `public/sw.js` | DETERMINISTIC offline cache | No | Serves cached shell and last saved plan | ServiceWorker integration test | "Offline mode — showing last saved air quality plan" |

---

## 2. Real LLM vs Honest Basic Mode Policy
1. **Server-Side Exclusivity:** `GeminiClient` (`src/server/llm/client.ts`) is invoked strictly server-side using Node environment variables:
   - `GEMINI_API_KEY`: Server secret (never exposed to browser bundles).
   - `GEMINI_MODEL`: Defaults to `gemini-3.8-flash`.
   - `LLM_ENABLED`: Feature flag (`true` / `false`).
2. **Honest Basic Mode:**
   - If `GEMINI_API_KEY` is not supplied, the application functions in **Basic Mode**:
     - Photo IAQ Audit returns a physical engineering checklist and explicitly displays:
       `"Tailored checklist for {focusArea}. Photo was not analysed by vision AI."`
     - Plan narration uses deterministic catalog text.
     - Follow-up Q&A returns categorized air quality safety guidance templates.
     - WhatsApp Bulletin uses verified bilingual templates.

---

## 3. No Silent Synthetic Data Policy
1. **Model vs Live Attribution:** All live air quality responses from Open-Meteo are attributed with `sourceLabel: 'Model-derived NAQI equivalent (Open-Meteo)'` and the observation timestamp.
2. **Failure Handling:** If the Open-Meteo API fails or returns non-finite values, the server responds with HTTP 502 (`PROVIDER_UNAVAILABLE`). It **never** fabricates default fallback numbers (e.g., 95 or 145).
3. **Demo Scenarios:** The four pre-computed winter smog scenarios (Delhi Severe, Patna Morning, Kolkata Smog, Winter Baseline) are segregated under `<optgroup label="Demo Scenarios (Synthetic Data)">` and clearly display the badge `Demo scenario (synthetic data)`.

---

## 4. Route Reconciliation

| Route | Method | Role | Status | Architectural Justification |
|---|---|---|---|---|
| `/api/geocode` | GET | City search | Spec standard | Geocoding service with proxy header validation |
| `/api/air-quality` | GET | Raw pollutant concentrations | Spec standard | Open-Meteo proxy with LRU caching |
| `/api/city-scenario` | GET | Aggregated live city scenario | Auxiliary | Composes geocoding + NAQI sub-indices + hourly dispersion for fast single-roundtrip UI load |
| `/api/plan` | POST | Deterministic plan generation | Spec standard | Validates profile against catalog rules engine |
| `/api/plan/narrate` | POST | Grounded plan text rewording | Spec standard | Re-validates plan server-side; invokes Gemini with action-ID guardrail |
| `/api/playbook` | POST | Playbook generation | Auxiliary | Specialized view-model composing IAQ hacks, emission swaps, and live impact math |
| `/api/ask` | POST | Scoped Q&A | Spec standard | Gemini prompt-injected guardrail with off-topic refusal |
| `/api/audit` | POST | Multimodal photo IAQ inspection | Spec standard | Magic-byte validation, 256 kB cap, Gemini Vision or deterministic checklist |
| `/api/bulletin` | POST | WhatsApp RWA advisory | Spec standard | Deterministic template with optional Gemini polish |
| `/api/health` | GET | Readiness / liveness probe | Spec standard | Uncached 200 OK |
| `/api/ready` | GET | Upstream readiness probe | Spec standard | Checks provider circuit breaker status |

---

## 5. Device-Local Community Truthfulness
1. **Pinboard:** Explicitly labelled *"Device-Local Smog Watch Pinboard — Saved on this device only"*. Zero seeded fake citizen reports or synthetic upvotes.
2. **Pledges:** Pledges and impact counters reflect solely the current browser's selected items.
3. **What-If Simulator:** Outputs are explicitly badged as *"Rough estimate"* with transparent mathematical formulas cited in `docs/EVIDENCE.md`.
