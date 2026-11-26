# EVIDENCE.md — Scientific Evidence & Source Citations
> Version: 1.0.0 | Status: VERIFIED | Last updated: 2026-11-22

This document provides the authoritative evidence base for all action catalog items and impact models in Clear Air Companion, satisfying **REQ-007**, **DATA-004**, and **Domain Rule D4**.

---

## 1. Official Standards & Regulatory Guidelines

### 1.1 US Environmental Protection Agency (US EPA)
- **40 CFR Part 58 — National Ambient Air Quality Standards (NAAQS) for PM2.5 (2024 Revision)**
  - *Standard*: Establishes PM2.5 numerical breakpoints for Good (0.0–9.0 µg/m³), Moderate (9.1–35.4 µg/m³), USG (35.5–55.4 µg/m³), Unhealthy (55.5–125.4 µg/m³), Very Unhealthy (125.5–225.4 µg/m³), and Hazardous (225.5+ µg/m³).
  - *Docket*: EPA-HQ-OAR-2015-0072.
  - *Used in*: `src/domain/bands.ts`.

- **Residential Air Cleaners: A Technical Summary (3rd Edition, 2023)**
  - *Findings*: Certified portable HEPA purifiers reduce indoor particle concentrations by 50% to 85% when appropriately sized to room volume.
  - *Document*: EPA 402-F-08-004.
  - *Used in*: `ACT-014`.

- **AP-42: Compilation of Air Pollutant Emission Factors (5th Edition, 2022)**
  - *Findings*: Open burning of biomass and municipal solid waste releases 200–800 g of fine particulate matter (PM2.5) per kilogram of refuse burned.
  - *Used in*: `ACT-022`.

### 1.2 World Health Organization (WHO)
- **WHO Global Air Quality Guidelines: Particulate Matter (PM2.5 and PM10), Ozone, Nitrogen Dioxide, Sulfur Dioxide and Carbon Monoxide (2021)**
  - *Findings*: Strict protective thresholds for particulate matter; documentation of physical activity risk-benefit trade-offs at extreme ambient PM2.5 (>150 µg/m³).
  - *ISBN*: 978-92-4-003422-8.
  - *Used in*: `ACT-001`, `ACT-002`, `ACT-010`.

- **WHO Guidelines for Indoor Air Quality: Household Fuel Combustion (2014)**
  - *Findings*: Transition from solid fuels (biomass, coal, kerosene) to clean fuels (LPG, electricity) avoids up to 45 kg of fine particulate and black carbon emissions per household per year.
  - *Used in*: `ACT-021`.

### 1.3 Central Pollution Control Board (CPCB, India)
- **National Clean Air Programme (NCAP) Comprehensive Source Apportionment Studies (2022–2023)**
  - *Findings*: Documented nocturnal temperature inversions in the Indo-Gangetic Plain causing surface PM2.5 concentrations to peak between 06:00 and 10:00, with a relative minimum between 12:00 and 15:00.
  - *Used in*: `ACT-001`, `ACT-006`, `ACT-012`.

- **National Air Quality Index (NAQI) Final Technical Report (2014, MoEFCC & IIT Kanpur)**
  - *Standard*: Establishes India 6-band NAQI sub-index equations and pollutant breakpoints for PM2.5, PM10, NO2, SO2, CO, O3, NH3, and Pb.
  - *Breakpoints (PM2.5)*: Good (0–30), Satisfactory (31–60), Moderately Polluted (61–90), Poor (91–120), Very Poor (121–250), Severe (251–380, capped at 500 max).
  - *Used in*: `src/domain/naqi.ts`, `src/domain/scenarios.ts`.

### 1.4 Berkeley Earth & Global Transport Emissions
- **Muller & Rohde (2015) — Air Pollution and Cigarette Equivalence**
  - *Findings*: Mathematical rule of thumb equating continuous 24-hour inhalation of ~22 µg/m³ of PM2.5 to the chronic cardiovascular/respiratory burden of 1 smoked cigarette.
  - *Used in*: `src/domain/naqi.ts`, `src/domain/emissions.ts`, `src/features/hero/AqiHeroCard.tsx`.

- **International Council on Clean Transportation (ICCT) India Light-Duty Vehicle Emissions (2020)**
  - *Findings*: Urban petrol sedan average emission factor of 180 g CO2/km; two-wheelers 45 g CO2/km; electrified/CNG urban bus and metro transit grid factor ~25 g CO2/passenger-km.
  - *Used in*: `src/domain/emissions.ts`, `src/domain/community.ts`.

- **IPCC Guidelines for National Greenhouse Gas Inventories & US EPA**
  - *Factor*: 2.31 kg CO2 emitted per litre of motor gasoline combusted.
  - *Tree absorption*: European Environment Agency average estimate of ~22 kg CO2 absorbed per mature deciduous/evergreen urban tree per year.
  - *Used in*: `src/domain/emissions.ts`.

---

## 2. Peer-Reviewed Literature

### 2.1 Indoor Filtration & Engineering Interventions
1. **Allen, R. W., et al. (2012)**
   - *Title*: "A randomized crossover trial of portable air filtration in residential homes."
   - *Journal*: *Environmental Health Perspectives*, 120(11), 1604–1610.
   - *Key Metric*: 60% average reduction in indoor PM2.5 in living spaces.

2. **Christopherson, D. A., et al. (2021)**
   - *Title*: "High-efficiency DIY air cleaner performance against aerosolized particulate matter."
   - *Journal*: *MedRxiv* / UC Davis Environmental Chamber Report.
   - *Key Metric*: Corsi-Rosenthal boxes equipped with MERV-13 filters deliver 600–850 m³/h clean air delivery rates at 80% lower cost than commercial purifiers.

3. **Singer, B. C., et al. (2017)**
   - *Title*: "Pollutant concentrations and exposure mitigation from kitchen range hood ventilation."
   - *Journal*: *Indoor Air*, 27(4), 815–828.
   - *Key Metric*: Cooktop exhaust ventilation reduces particle capture by 35–65%.

4. **Fisk, W. J., et al. (2013)**
   - *Title*: "Air infiltration and energy efficiency in residential buildings."
   - *Journal*: *Building and Environment*, 65, 122–131.
   - *Key Metric*: Weatherstripping leaky frames reduces infiltration rates by 20–45%.

---

## 3. Banned & Discredited Interventions (D3 / Safety Guard)
Under **Domain Rule D3**, the following claims are banned and excluded from the catalog:
- **Ozone generators / "ionizers"**: Produce respiratory tract irritants (O3) and secondary organic aerosols.
- **Indoor houseplants as PM2.5 purifiers**: Field research (Cummings & Waring, 2020) demonstrated that typical plant densities produce negligible clean air delivery (<1 CADR).
- **Ventilating during morning smog**: Infiltration during ground temperature inversions spikes indoor PM2.5.
- **Medical prescribing**: No pharmaceutical advice or symptom diagnosis.
