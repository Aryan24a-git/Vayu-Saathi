# CATALOG.md — Curated Action Catalog & Evidence Base
> Version: 1.0.0 | Status: VERIFIED

## 1. Overview
The action catalog (`src/catalog/catalog.json`) serves as the single source of truth for all Clear Air Companion recommendations. Under Domain Rule D6, the LLM is strictly prohibited from inventing advice; it may only select, order, and phrase actions defined here.

## 2. Evidence Standards (DATA-004)
Every catalog action MUST contain a complete impact evidence block:
- `magnitudeRange`: Numerical interval (`low` and `high`) with units.
- `magnitudeDescription`: Clear explanation of the projected reduction.
- `basis`: Scientific basis (clinical trials, epidemiological studies, or physical chamber testing).
- `confidence`: "high" (peer-reviewed / RCT), "medium" (observational modeling), or "low" (expert extrapolation).
- `benefitType`: "personal_exposure", "emissions", or "both".
- `sourceNote`: Explicit citation (e.g. WHO 2021, EPA 2023, CPCB 2022).

## 3. Action Inventory
The catalog currently contains 28 validated actions across 4 core categories:
1. **Routine**: Diurnal scheduling, window closures during morning inversions, mask selection.
2. **Indoor**: Sealing door/window gaps, Corsi-Rosenthal boxes, bedroom HEPA filtering, kitchen exhaust ventilation.
3. **Alternative**: Modal shifts (metro/bus), WFH on severe smog days, clean cooking fuel transitions.
4. **Community**: Colony-level notifications, anti-biomass burning coordination, collective emission reductions.

## 4. Build-Time Guard
The catalog is strictly guarded by `src/catalog/catalog.schema.ts` and validated via `src/catalog/validate-catalog.ts`. Any missing citation or malformed impact block fails the build.
