# docs/RELEASE_NOTES.md — Clear Air Companion Release Notes
> Version: 1.0.0 | Release Date: 2026-11-23 | Target: Production Release

---

## 1. Executive Summary

Clear Air Companion v1.0.0 is a GenAI-augmented decision-support web application for families and communities navigating severe winter smog. Built for resilience during extreme pollution events (PM2.5 > 300 µg/m³), the system provides personalized, evidence-grounded action plans that protect vulnerable household members while honoring family budget constraints.

### The Three Core Capabilities
1. **Suggest**: 28 curated, peer-reviewed protective actions spanning immediate daily routines, low-cost indoor air quality interventions, and sustainable community alternatives.
2. **Tailor**: Dynamic plan customization driven by live/manual AQI and a versioned household profile (age bands, vulnerabilities, housing leakage, cooking fuel, heating source, and budget tier).
3. **Explain**: Every recommendation provides honest uncertainty ranges, verified scientific citations (WHO 2021, EPA 2023, CPCB), and transparent confidence levels.

---

## 2. Key Features & Architectural Highlights

- **Pure Domain Core**: Zero-I/O deterministic rules engine (`src/domain/`) with 99.08% line coverage.
- **Catalog Grounding (Rule D6)**: The LLM acts exclusively as a phrase-builder and synthesizer; it cannot invent uncurated advice or medical treatments.
- **Dual Operating Modes**:
  - *Full AI Mode*: Grounded narrative synthesis powered by Anthropic Messages API (`claude-haiku-5-5`).
  - *Deterministic Basic Mode*: 100% functional without LLM keys or external API availability.
- **Privacy by Default (DATA-001 to DATA-003)**: Zero server persistence; household profile lives exclusively in browser `localStorage`. Geolocation coordinates are truncated to 2 decimal places (~1 km precision) before query or logging.
- **Resilient Upstream Integration (REL-001 to REL-003)**: Circuit breaker, exponential backoff, request coalescing, and LRU memory cache for Open-Meteo AQI and geocoding services.
- **Observability (OBS-001, OBS-002)**: Structured JSON logging with redacted PII and standard telemetry counters (`cacheHit`, `providerFailure`, `breakerOpen`, `fallbackRate`).
- **Lean Multi-Stage Container (DEP-001)**: Next.js 14 standalone distribution running as an unprivileged user (`nextjs:nodejs`, UID 1001) with built-in periodic health checking.
- **Offline Shell & Scope Addition (Service Worker)**: Added `public/sw.js` for caching the offline application shell (`/`, `/plan`, `/ask`). Explicit security guard verified: never intercepts or caches any `/api/*` requests (`/api/plan`, `/api/ask`, `/api/aqi`, `/api/health`, `/api/ready`), ensuring dynamic live plan logic and API rate limiting are never cached.

---

## 3. Verified Quality & Compliance Matrix

| Requirement Set | Scope | Status | Evidence |
|---|---|---|---|
| Functional (REQ-001 to REQ-016) | Location, Profile, AQI, Plan, Hacks, Alternatives, Impact, Q&A | **VERIFIED** | 86 unit & integration tests passing (REQ-009 verified on fixtures, live key UNVERIFIED) |
| Security (SEC-001 to SEC-010) | Zod boundaries, no secret leaks, rate limits, CSP headers, SSRF allowlist | **VERIFIED (With Warnings)** | Automated security test suite & audit; upstream CVEs documented |
| Reliability (REL-001 to REL-004) | Fallback on 503, basic mode, circuit breaker, retry-after | **VERIFIED** | Resilience & provider failure test specs (REL-002 Critical VERIFIED) |
| Accessibility (A11Y-001 to A11Y-006)| WCAG 2.1 AA automated axe audit, 320px reflow, static assistant | **VERIFIED (Automated)** | Playwright axe specs 0 violations; real screen reader UNVERIFIED |
| Performance (PERF-001 to PERF-005) | First-load JS < 150 kB, mobile LCP < 2.5s, plan p95 < 300ms | **VERIFIED** | Lighthouse baseline & benchmark scripts |
| Data & Privacy (DATA-001 to DATA-004)| 0 server persistence, 2dp coords, local profile, citations | **VERIFIED** | 24/28 actions high/med confidence; 4 low confidence flagged for review |

---

## 4. Known Security Advisories & Upgrades

As documented in `docs/SECURITY_AUDIT.md`:
- **SEC-FIND-001 (Next.js 14.x CVEs)**: Next.js v14 carries upstream CVEs in self-hosted Image Optimization and Server Actions. The application does not expose user uploads or Server Actions. Upgrading to Next.js 15+ is scheduled as the primary post-release maintenance milestone.
- **SEC-FIND-002 (Zod 3.x Memory Exhaustion)**: Mitigated in production via strict 64 kB payload body limits in `src/server/security/limits.ts`. Migration to Zod 4 is planned.

---

## 5. Deployment & Release Artifacts

- **Dockerfile**: Multi-stage standalone Node.js 20 Alpine container.
- **CD Workflow**: `.github/workflows/cd.yml` publishing to GitHub Container Registry on `v*.*.*` tags.
- **Runbook**: Complete incident response and rollback guide in `docs/RUNBOOK.md`.
- **Smoke Tests**: Automated verification suite in `scripts/smoke.sh` and `scripts/smoke.ps1`.
