# DOMAIN.md — Clear Air Companion Domain Rules

## The Three Core Verbs (Alignment Anchor for EC-002)

1. **Suggest** — low-emission daily routines, indoor air quality hacks, sustainable alternatives
2. **Tailor** — to location (live air quality) and lifestyle (household members, housing, cooking, heating, commute, budget)
3. **Explain** — clearly show the direct impact of each choice (personal exposure + emissions), with honest uncertainty

## Domain Rules (D1–D6)

### D1 — Protective Escalation
Guidance escalates monotonically with AQI band AND household vulnerability.
- Higher AQI → more protective, more restrictive recommendations
- Higher vulnerability (asthmatic child, elderly with heart/lung) → conservative escalation applied one band earlier
- Band 6–7 (Hazardous/Severe): all outdoor activities suspended, N95 mandatory, maximum indoor protection

### D2 — Feasibility Filter
Recommendations MUST be feasible for the stated budget and housing type.
- Budget band `none` (zero): only free actions (ventilation timing, behavior change, homemade remedies from catalog)
- Budget band `low` (<INR 500/month): free actions + low-cost catalog items
- Budget band `medium` (<INR 2000/month): free + low-cost + mid-tier catalog items
- Budget band `high`: all catalog items
- An air purifier recommendation is NEVER shown to `none` or `low` budget households unless a free DIY alternative is shown alongside it

### D3 — Do No Harm
NEVER recommend:
- Opening windows or doors during peak pollution hours (AQI > 100)
- Ozone-generating air "purifiers" or ionizers
- Burning waste, biomass, or fuel indoors
- Unsafe DIY electrical modifications
- Any action that is conditional on unavailable resources without stating the condition

### D4 — Impact Transparency
Every recommendation in the catalog has an impact evidence block:
```json
{
  "magnitudeRange": { "low": 15, "high": 40, "unit": "%" },
  "basis": "WHO indoor air quality guidelines + EPA residential infiltration studies",
  "confidence": "medium",
  "benefitType": "personal_exposure",
  "sourceNote": "WHO 2021, EPA 2023"
}
```
- `confidence` is "high" (RCT or meta-analysis), "medium" (observational study or modeling), or "low" (expert opinion or extrapolation)
- `benefitType` distinguishes personal exposure benefit from emissions/community benefit
- Magnitude ranges always accompany point estimates
- The UI always shows ranges, not point estimates, with the basis and confidence label
- Unsourced figures are BANNED from the catalog — build fails on DATA-004 violation

### D5 — No Medical Advice
- Never diagnose or recommend treatment
- Symptom red-flags (difficulty breathing, chest pain, blue lips, confusion in elderly) ALWAYS route to: "Seek immediate medical care / call emergency services"
- Sensitive group guidance is protective (reduce exposure, avoid triggers) not diagnostic
- Always include: "This app provides information only, not medical advice. Consult a healthcare provider for medical concerns."

### D6 — Catalog Grounding (Anti-Hallucination)
- The LLM CANNOT invent actions
- The LLM selects action IDs from a candidate list provided by the rules engine
- The LLM orders and phrases the selected actions
- The LLM output is validated: every action ID must exist in the catalog
- The prompt uses delimiters and schema constraints to prevent injection

## AQI Band Table

| Band ID | AQI Range | PM2.5 µg/m³ | Label | Escalation Level | Vulnerable Escalation |
|---------|-----------|-------------|-------|-----------------|----------------------|
| `good` | 0–50 | 0–12.0 | Good | 0 | 0 |
| `moderate` | 51–100 | 12.1–35.4 | Moderate | 1 | 1 |
| `usg` | 101–150 | 35.5–55.4 | Unhealthy for Sensitive Groups | 2 | 3 |
| `unhealthy` | 151–200 | 55.5–150.4 | Unhealthy | 3 | 4 |
| `very_unhealthy` | 201–300 | 150.5–250.4 | Very Unhealthy | 4 | 5 |
| `hazardous` | 301–500 | 250.5–500.0 | Hazardous | 5 | 6 |
| `severe` | 500+ | 500+ | Severe (winter smog) | 6 | 6 |

## Vulnerability Flags

| Flag | Description | Effect |
|------|-------------|--------|
| `asthma` | Asthmatic household member | Escalation applied one band earlier |
| `heart_disease` | Cardiovascular condition | Escalation applied one band earlier |
| `lung_disease` | COPD, pulmonary condition | Escalation applied one band earlier |
| `elderly` | Age 65+ | Escalation applied one band earlier if any health flag also set |
| `infant` | Age under 2 | Escalation applied one band earlier |
| `pregnant` | Pregnancy | Escalation applied one band earlier |

Multiple flags compound: if two or more apply, escalation applied TWO bands earlier (capped at band 6).

## Housing Types and Their Implications

| Housing Type | Sealing | Infiltration Rate | Default Purifier Assumption |
|-------------|---------|-------------------|---------------------------|
| `well_sealed` | Good | Low | None required at AQI < 150 |
| `average` | Average | Medium | Recommended at AQI > 100 |
| `poorly_sealed` | Poor | High | Recommended at AQI > 50 |
| `open` | None | Very High | DIY filter required at AQI > 50 |

## Cooking Fuel Implications

| Fuel | Indoor Pollution Risk | Priority Action |
|------|-----------------------|----------------|
| `lpg` | Low | Standard ventilation during cooking |
| `natural_gas` | Low-Medium | Ventilation during cooking, NO purifier during cooking |
| `kerosene` | High | Switch to LPG/electric is top recommendation |
| `biomass` | Very High | Emergency: improved cookstove or outdoor cooking |
| `electric` | None | No fuel-related actions |
| `induction` | None | No fuel-related actions |
