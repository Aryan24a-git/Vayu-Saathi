// Satisfies: REQ-006, REQ-007, DATA-004, D2, D3, D4
// Curated sustainable alternatives and community-scale emission reduction actions.

import type { ActionEntry } from './schema';

export const ALTERNATIVES_ACTIONS: readonly ActionEntry[] = [
  {
    id: 'ACT-021',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.switch_clean_cooking.title',
    bodyKey: 'catalog.alternatives.switch_clean_cooking.body',
    applicableIf: { targetCooking: ['biomass', 'kerosene'] },
    cost: 'low',
    effort: 2,
    risks: [],
    impact: {
      benefitType: 'emissions',
      metric: 'household_black_carbon_and_pm25',
      amount: { low: 15, high: 45, unit: 'kg PM2.5/household/year' },
      basis:
        'Switching solid fuels to LPG or induction avoids severe incomplete combustion emissions of particulate carbon.',
      confidence: 'high',
      sourceNote: 'Smith et al., Lancet / WHO Household Air Pollution Guidelines (2014)',
    },
  },
  {
    id: 'ACT-022',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.stop_waste_burning.title',
    bodyKey: 'catalog.alternatives.stop_waste_burning.body',
    applicableIf: {},
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'emissions',
      metric: 'local_fine_particulate_emissions',
      amount: { low: 200, high: 800, unit: 'g PM2.5/kg waste avoided' },
      basis:
        'Low-temperature open burning of biomass and municipal refuse emits high levels of toxic polycyclic aromatics and fine soot.',
      confidence: 'high',
      sourceNote: 'US EPA AP-42 Open Burning Emission Factors & CPCB (2022)',
    },
  },
  {
    id: 'ACT-023',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.modal_shift_transit.title',
    bodyKey: 'catalog.alternatives.modal_shift_transit.body',
    applicableIf: {},
    cost: 'free',
    effort: 2,
    risks: ['Transit schedule dependency'],
    impact: {
      benefitType: 'emissions',
      metric: 'passenger_km_tailpipe_emissions',
      amount: { low: 50, high: 180, unit: 'g CO2e/passenger-km avoided' },
      basis:
        'Electric metro and bus systems reduce personal vehicle fuel combustion and stop-and-go congestion idling.',
      confidence: 'high',
      sourceNote: 'CPCB Urban Transport Emission Factor Toolkit & IPCC AR6 (2022)',
    },
  },
  {
    id: 'ACT-024',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.electric_space_heating.title',
    bodyKey: 'catalog.alternatives.electric_space_heating.body',
    applicableIf: { targetHeating: ['biomass'] },
    cost: 'medium',
    effort: 2,
    risks: ['Electricity bill increase during cold spells'],
    impact: {
      benefitType: 'emissions',
      metric: 'indoor_and_neighborhood_soot',
      amount: { low: 10, high: 30, unit: 'kg PM2.5/season avoided' },
      basis:
        'Eliminating unvented indoor coal braziers or firewood burning prevents direct primary emission of toxic soot.',
      confidence: 'high',
      sourceNote:
        'Chafe et al., Environmental Health Perspectives / Global Burden of Disease (2014)',
    },
  },
  {
    id: 'ACT-025',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.shared_clean_room.title',
    bodyKey: 'catalog.alternatives.shared_clean_room.body',
    applicableIf: { minBandOrdinal: 3 },
    cost: 'low',
    effort: 3,
    risks: ['Coordination overhead between neighbors'],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'community_member_pm25_inhalation',
      effectFraction: { low: 0.4, high: 0.75 },
      basis:
        'A neighborhood clean-air room equipped with commercial or box-fan filters provides refuge for poorly-sealed households.',
      confidence: 'medium',
      sourceNote: 'Public Health England / US EPA Wildfire Smoke Public Refuge Evaluation (2020)',
    },
  },
  {
    id: 'ACT-026',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.reduce_single_use_plastic.title',
    bodyKey: 'catalog.alternatives.reduce_single_use_plastic.body',
    applicableIf: {},
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'emissions',
      metric: 'uncollected_plastic_waste',
      amount: { low: 2, high: 10, unit: 'kg chlorinated plastic/household/year' },
      basis:
        'Reducing disposable packaging lowers the volume of unsegregated roadside waste that is illegally incinerated.',
      confidence: 'medium',
      sourceNote: 'UN Environment Programme Plastics and Air Quality Brief (2021)',
    },
  },
  {
    id: 'ACT-027',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.anti_idling.title',
    bodyKey: 'catalog.alternatives.anti_idling.body',
    applicableIf: {},
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'emissions',
      metric: 'curbside_tailpipe_emissions',
      amount: { low: 1, high: 4, unit: 'g PM2.5/hour idling avoided' },
      basis:
        'Switching off engines when stationary for >30 seconds avoids ultra-fine particulate plumes in street canyons.',
      confidence: 'high',
      sourceNote: 'US EPA Clean School Bus and Anti-Idling Environmental Assessment (2021)',
    },
  },
  {
    id: 'ACT-028',
    section: 'alternatives',
    titleKey: 'catalog.alternatives.report_illegal_burning.title',
    bodyKey: 'catalog.alternatives.report_illegal_burning.body',
    applicableIf: { minBandOrdinal: 2 },
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'emissions',
      metric: 'rapid_enforcement_smoldering_cessation',
      amount: { low: 50, high: 500, unit: 'kg PM2.5 prevented via extinguishment' },
      basis:
        'Citizen reporting of open municipal waste and leaf fires triggers rapid municipal firefighting intervention.',
      confidence: 'medium',
      sourceNote: 'CPCB / Delhi Pollution Control Committee Action Plan (2023)',
    },
  },
] as const;
