# Clear Air Companion 🌬️

> GenAI assistant for families and communities navigating severe winter smog.

[![CI](https://github.com/your-org/clear-air-companion/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/clear-air-companion/actions/workflows/ci.yml)

## What It Does

During severe winter smog (PM2.5 > 300 µg/m³), Clear Air Companion gives you a **personalized daily plan** — not generic advice. It:

1. **Suggests** low-emission routines, indoor air quality hacks, sustainable alternatives
2. **Tailors** recommendations to your location (live AQI), household members, housing, budget
3. **Explains** the direct impact of each choice — with honest uncertainty ranges, sources, and confidence levels

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd clear-air-companion

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — see Configuration section below

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Configuration

Copy `.env.example` and fill in values:

```bash
# Required
GEMINI_API_KEY=your-gemini-api-key-here

# Optional (defaults shown)
LLM_DAILY_TOKEN_BUDGET=1000000
AQI_CACHE_TTL_MINUTES=15
AQI_CACHE_MAX_ENTRIES=500
LLM_CACHE_TTL_MINUTES=30
LLM_CACHE_MAX_ENTRIES=100
RATE_LIMIT_PLAN_PER_MINUTE=10
RATE_LIMIT_AQI_PER_MINUTE=60
NODE_ENV=development
```

The app starts without `GEMINI_API_KEY` and uses deterministic fallback plans.

## Development

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production build
npm run lint         # ESLint + Prettier check
npm run type-check   # TypeScript strict check
npm run test         # All tests
npm run test:unit    # Unit tests (domain core)
npm run test:integration  # API integration tests (MSW)
npm run test:ai      # LLM contract + guardrail tests
npm run test:e2e     # Playwright E2E + axe
npm run test:coverage # Coverage report (domain ≥ 90%)
```

## Architecture

```
src/
  app/              # Next.js App Router (pages + API routes)
  domain/           # Pure functions: rules engine, AQI bands, impact model
  lib/              # Providers, AI client, cache, logger, rate-limit
  catalog/          # Curated action catalog (catalog.json)
  components/       # React UI components
  i18n/             # Externalized strings (English; i18n-ready)

docs/
  AGENTS.md         # 14-step agent contract (all V2 builds follow this)
  ARCHITECTURE.md   # Module map, degradation matrix, security architecture
  DOMAIN.md         # Domain rules D1–D6, AQI band table
  REQUIREMENTS.md   # Full requirement registry (REQ/NFR/SEC/A11Y/PERF/...)
  SECURITY.md       # Threat model and security controls
  TESTING.md        # Test strategy and coverage targets
  ACCESSIBILITY.md  # WCAG 2.1 AA checklist and implementation guide
  TRACEABILITY.md   # EC → REQ → code mapping

tests/
  unit/             # Domain core tests (≥90% coverage target)
  integration/      # API tests with MSW mocks
  e2e/              # Playwright E2E + axe accessibility
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No database | Privacy-first, hackathon scope, localStorage profile |
| LLM grounding | Catalog prevents hallucinated advice (domain rule D6) |
| Deterministic fallback | App fully usable when LLM/AQI unavailable |
| Open-Meteo (keyless) | Free tier, no account needed for AQI + geocoding |
| Coordinates rounded to 2dp | Privacy: ~1km precision, never stored server-side |

## Data Sources

| Data | Source | License |
|------|--------|---------|
| Air Quality (PM2.5, AQI) | [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api) | CC BY 4.0 |
| Geocoding | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | CC BY 4.0 |
| Impact Evidence | WHO 2021, EPA 2023, CPCB | Cited per action in catalog |
| AI Narrative | Google Gemini (server-side) | — |

## Personas

| Persona | Key Need |
|---------|----------|
| P1: Urban parent | "What do I do today" for 2 kids (1 asthmatic), moderate budget |
| P2: Multigenerational | Conservative guidance for elderly with heart/lung conditions |
| P3: Community organiser | Shareable/printable plan, "what if 100 homes do this" |
| P4: Low-resource household | Free actions, plain language, works on slow 3G |

## Contributing

1. Read `AGENTS.md` — the 14-step contract applies to all contributors
2. Run `npm run lint && npm run type-check && npm run test` before committing
3. Files must be < 250 lines, functions < 40 lines
4. Every new action in the catalog requires a sourced impact evidence block

## Disclaimer

This app provides information only, not medical advice. During severe air pollution events, consult local health authorities. For breathing difficulties, chest pain, or other symptoms, seek immediate medical care.

## License

MIT
