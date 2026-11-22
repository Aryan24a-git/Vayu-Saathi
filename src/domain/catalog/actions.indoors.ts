// Satisfies: REQ-005, REQ-007, DATA-004, D2, D3, D4
// Curated indoor air quality interventions for winter smog.

import type { ActionEntry } from './schema';

export const INDOORS_ACTIONS: readonly ActionEntry[] = [
  {
    id: 'ACT-011',
    section: 'indoors',
    titleKey: 'catalog.indoors.keep_windows_closed_peak.title',
    bodyKey: 'catalog.indoors.keep_windows_closed_peak.body',
    applicableIf: { minBandOrdinal: 2, targetHousing: ['average', 'leaky', 'tight'] },
    cost: 'free',
    effort: 1,
    risks: ['CO2 accumulation if closed continuously for >12h without brief air exchange'],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'indoor_pm25',
      effectFraction: { low: 0.25, high: 0.5 },
      basis:
        'Closing exterior fenestration attenuates building infiltration during peak ambient pollution hours.',
      confidence: 'high',
      sourceNote: 'Fisk et al., Indoor Air Quality & Ventilation Infiltration Models (2013)',
    },
  },
  {
    id: 'ACT-012',
    section: 'indoors',
    titleKey: 'catalog.indoors.midday_ventilation.title',
    bodyKey: 'catalog.indoors.midday_ventilation.body',
    applicableIf: { minBandOrdinal: 1, maxBandOrdinal: 3 },
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'indoor_air_exchange',
      effectFraction: { low: 0.15, high: 0.3 },
      basis:
        'Short 10-15 minute midday air exchange flushes indoor VOCs and CO2 while outdoor PM2.5 is at its diurnal minimum.',
      confidence: 'medium',
      sourceNote: 'ASHRAE Standard 62.2 Ventilation and Acceptable Indoor Air Quality (2022)',
    },
  },
  {
    id: 'ACT-013',
    section: 'indoors',
    titleKey: 'catalog.indoors.seal_gaps_weatherstrip.title',
    bodyKey: 'catalog.indoors.seal_gaps_weatherstrip.body',
    applicableIf: { targetHousing: ['leaky', 'average'] },
    cost: 'low',
    effort: 2,
    risks: [],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'indoor_pm25',
      effectFraction: { low: 0.2, high: 0.45 },
      basis:
        'Self-adhesive foam weatherstrips on doorframes and windows reduce the passive infiltration air change rate.',
      confidence: 'high',
      sourceNote: 'US EPA Indoor Air Quality Building Assessment Protocol (2023)',
    },
  },
  {
    id: 'ACT-014',
    section: 'indoors',
    titleKey: 'catalog.indoors.hepa_purifier_bedroom.title',
    bodyKey: 'catalog.indoors.hepa_purifier_bedroom.body',
    applicableIf: { minBandOrdinal: 2 },
    cost: 'medium',
    effort: 1,
    risks: ['Filter replacement cost every 6-12 months'],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'indoor_pm25',
      effectFraction: { low: 0.5, high: 0.85 },
      basis:
        'Randomized controlled trials of portable HEPA cleaners demonstrate 50-85% reductions in residential indoor PM2.5.',
      confidence: 'high',
      sourceNote:
        'Allen et al., Environmental Health Perspectives (2012) & EPA Air Cleaner Guidance (2023)',
    },
  },
  {
    id: 'ACT-015',
    section: 'indoors',
    titleKey: 'catalog.indoors.diy_boxfan_filter.title',
    bodyKey: 'catalog.indoors.diy_boxfan_filter.body',
    applicableIf: { minBandOrdinal: 2 },
    cost: 'low',
    effort: 2,
    risks: ['Electrical fan motor must not be overloaded; do not leave unattended overnight'],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'indoor_pm25',
      effectFraction: { low: 0.6, high: 0.85 },
      basis:
        'Corsi-Rosenthal boxes with MERV-13 filters deliver clean air delivery rates (CADR) comparable to commercial units.',
      confidence: 'high',
      sourceNote: 'Christopherson et al., MedRxiv & UC Davis Indoor Air Validation Study (2021)',
    },
  },
  {
    id: 'ACT-016',
    section: 'indoors',
    titleKey: 'catalog.indoors.damp_mop_no_dry_sweep.title',
    bodyKey: 'catalog.indoors.damp_mop_no_dry_sweep.body',
    applicableIf: { minBandOrdinal: 1 },
    cost: 'free',
    effort: 1,
    risks: ['Slipping on wet floors'],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'resuspended_particulate',
      effectFraction: { low: 0.4, high: 0.75 },
      basis:
        'Dry sweeping resuspends coarse and fine dust into the breathing zone; damp mopping traps surface particles.',
      confidence: 'high',
      sourceNote: 'WHO Guidelines for Indoor Air Quality: Selected Pollutants (2010)',
    },
  },
  {
    id: 'ACT-017',
    section: 'indoors',
    titleKey: 'catalog.indoors.ban_incense_coils.title',
    bodyKey: 'catalog.indoors.ban_incense_coils.body',
    applicableIf: { minBandOrdinal: 1 },
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'indoor_pm25',
      effectFraction: { low: 0.3, high: 0.6 },
      basis:
        'Burning a single mosquito coil or incense stick releases PM2.5 mass comparable to 50-100 cigarettes.',
      confidence: 'high',
      sourceNote: 'Liu et al., Environmental Health Perspectives (2003) & CPCB Indoor Guidelines',
    },
  },
  {
    id: 'ACT-018',
    section: 'indoors',
    titleKey: 'catalog.indoors.kitchen_exhaust_ventilation.title',
    bodyKey: 'catalog.indoors.kitchen_exhaust_ventilation.body',
    applicableIf: { targetCooking: ['lpg', 'png', 'biomass', 'kerosene'] },
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'cooking_combustion_byproducts',
      effectFraction: { low: 0.35, high: 0.65 },
      basis:
        'Range hoods and kitchen exhaust remove ultra-fine particles and nitrogen dioxide produced during stove combustion.',
      confidence: 'high',
      sourceNote:
        'Singer et al., Lawrence Berkeley National Laboratory Residential Indoor Air Study (2017)',
    },
  },
  {
    id: 'ACT-019',
    section: 'indoors',
    titleKey: 'catalog.indoors.bedroom_clean_sanctuary.title',
    bodyKey: 'catalog.indoors.bedroom_clean_sanctuary.body',
    applicableIf: { minBandOrdinal: 3 },
    cost: 'free',
    effort: 1,
    risks: [],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'nocturnal_pm25_inhalation',
      effectFraction: { low: 0.3, high: 0.6 },
      basis:
        'Isolating a single sleeping room and running localized filtration creates a low-exposure sanctuary for 8 hours daily.',
      confidence: 'high',
      sourceNote: 'US EPA Indoor Environments Division: Creating a Clean Room at Home (2022)',
    },
  },
  {
    id: 'ACT-020',
    section: 'indoors',
    titleKey: 'catalog.indoors.maintain_humidity.title',
    bodyKey: 'catalog.indoors.maintain_humidity.body',
    applicableIf: {
      minBandOrdinal: 2,
      requiredSensitivities: ['asthma', 'copd'],
    },
    cost: 'free',
    effort: 1,
    risks: ['Excess humidity >65% promotes mold growth'],
    impact: {
      benefitType: 'personal_exposure',
      metric: 'airway_mucosal_irritation',
      effectFraction: { low: 0.15, high: 0.3 },
      basis:
        'Relative humidity between 40-60% preserves mucosal ciliary clearance and mitigates dry winter smog airway hyperresponsiveness.',
      confidence: 'medium',
      sourceNote: 'WHO Guidelines for Indoor Air Quality: Dampness and Mould (2009)',
    },
  },
] as const;
