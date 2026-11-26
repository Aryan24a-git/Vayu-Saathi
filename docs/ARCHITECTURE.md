# ARCHITECTURE.md — Clear Air Companion

## Overview

Clear Air Companion is a **modular monolith** built on Next.js 14 (App Router).
It has no database, no message queue, and no microservices. All server state is ephemeral.

## Architecture Principles

1. **Domain core is pure** — `src/domain/` contains only pure functions with zero I/O. This makes testing trivial and ensures domain rules are always enforced (EC-001, EC-005).
2. **Providers sit behind interfaces** — AQI and geocoding providers are swappable. The app ships with Open-Meteo adapters (keyless, free-tier). OpenAQ or CPCB can replace them without touching domain logic.
3. **LLM is an optional enhancer** — The rules engine produces a valid plan without the LLM. The LLM only selects, orders, and phrases catalog items into natural narrative.
4. **Catalog is ground truth** — The action catalog (`src/catalog/catalog.json`) is the only source of recommendations. Build-time validation ensures every action has sourced impact evidence.
5. **Security is layered** — Rate limiting → body size limit → Zod validation → prompt-injection defenses → schema-validated output → no raw HTML rendering.

## Request Flow: Plan Generation

```
Browser
  → POST /api/plan (profile + coordinates, Zod-validated)
    → Rate limit check
    → Round coordinates to 2dp (DATA-001)
    → Fetch AQI (cache-first, TTL 15min, LRU bounded)
    → rules-engine.ts: build candidate actions (pure, deterministic)
    → ai/planner.ts: LLM selects/orders/phrases from candidates
      → Fallback to rules-engine output if LLM fails
    → Validate LLM output against Zod schema
    → Return structured plan (action IDs + narrative + impact)
Browser
  → Render plan (catalog lookups by ID, no raw HTML)
```

## Caching Strategy

| Cache | Key | TTL | Max Entries |
|-------|-----|-----|-------------|
| AQI | rounded coords | 15 min | 500 |
| Geocode | city name | 24 hr | 200 |
| LLM plan | profile-shape hash | 30 min | 100 |

All caches use the LRU implementation in `src/lib/cache.ts`.

## Security Architecture

- **API keys** live only in environment variables, accessed only in API routes
- **Client bundle** contains zero secrets (enforced by Next.js server components)
- **CSP** blocks inline scripts, disallows `eval`, restricts connect-src to known hosts
- **Rate limiting** is per-client IP, 10 req/min for /api/plan, 60 req/min for /api/aqi
- **LLM budget guard** caps daily token usage; excess requests get deterministic fallback
- **SSRF guard** — outbound HTTP uses a fixed allowlist: `open-meteo.com`, `api.open-meteo.com`, `generativelanguage.googleapis.com`

## Deployment Architecture

- Next.js application containerized with Docker
- 12-factor config: all configuration via environment variables
- Health endpoint: `GET /api/health` (liveness)
- Readiness endpoint: `GET /api/health/ready` (checks provider reachability)
- Zero persistent state: stateless container, horizontally scalable

## Provider Interface

```typescript
// src/lib/providers/aqi.ts
interface AqiProvider {
  fetchCurrent(lat: number, lon: number): Promise<AqiReading>;
  fetchForecast(lat: number, lon: number, hours: number): Promise<AqiForecast[]>;
}

// src/lib/providers/geocoding.ts
interface GeocodingProvider {
  search(query: string): Promise<GeocodingResult[]>;
  reverse(lat: number, lon: number): Promise<GeocodingResult | null>;
}
```

## Degradation Matrix

| Scenario | Detection | Response | UI Indicator |
|----------|-----------|----------|--------------|
| AQI provider timeout | 5s timeout + circuit breaker | Manual AQI entry enabled | "Live data unavailable" banner |
| AQI provider 5xx | Circuit breaker (3 failures) | Cached data if <2h old, else manual | Staleness timestamp |
| LLM timeout | 10s timeout | Deterministic rules-engine plan | "AI narrative unavailable" note |
| LLM quota | 429 response | Deterministic fallback + budget counter | No UI change |
| LLM invalid output | Zod schema fail | Retry once, then deterministic | No UI change |
| Geolocation denied | Browser event | City search UI shown | "Enter your city" prompt |
| Offline | Navigator.onLine false | Last cached plan | Offline indicator |
| No regional data | Empty AQI response | Manual AQI entry | "Data unavailable for region" |

## File Size Discipline

Enforced by ESLint plugin (see `.eslintrc.js`). Hard limits:
- Files: 250 lines max
- Functions: 40 lines max
- Violations block CI.
