// Deterministic Playbook Generator
// Strictly typed, functions < 40 lines, file < 250 lines

import type { LocationScenario, HouseholdProfile, CalculatedImpact } from './scenarios';
import type { VentilationWindow } from './naqi';

export interface PlaybookItem {
  id: string;
  title: string;
  detail: string;
  tag: string;
  exposurePct: number;
  co2Kg: number;
}

export interface PlaybookData {
  iaqHacks: PlaybookItem[];
  emissionSwaps: PlaybookItem[];
  explainer: {
    healthWhy: string;
    emissionWhy: string;
    vulnerabilityNote: string;
  };
  aiSummary?: string;
  generatedAt?: string;
}

export function formatVulnList(vulns: readonly string[]): string {
  const map: Record<string, string> = {
    kids: 'Kids <12',
    seniors: 'Seniors 60+',
    asthma: 'Asthma/Resp.',
    none: 'General',
  };
  if (!vulns || vulns.length === 0) return 'General';
  return vulns.map((v) => map[v] || v).join(', ');
}

function buildIaqHacks(
  loc: LocationScenario,
  profile: HouseholdProfile,
  vent: VentilationWindow | null,
  impact: CalculatedImpact
): PlaybookItem[] {
  const ventPhrase = vent ? vent.windowLabel : 'cleanest midday hours';
  const sealPhrase = vent ? vent.sealLabel : 'evening inversion';
  const hacks: PlaybookItem[] = [
    {
      id: 'iaq-1',
      title: 'Wet Mop Only — Skip Dry Broom Sweeping Today',
      detail: `At ${loc.pm10} µg/m³ PM10, dry jhadu kicks settled road dust right back into breathing height. Use a damp microfiber mop or wet cloth.`,
      tag: '₹0 Habit',
      exposurePct: Math.round(impact.maxExposureDropPct * 0.3),
      co2Kg: 0.05,
    },
  ];

  if (profile.budgetTier === 'zero_cost') {
    hacks.push({
      id: 'iaq-2',
      title: 'Damp Rolled-Towel Door & Window Gap Sealing',
      detail: `Keep windows shut outside ${ventPhrase}. Press damp rolled cotton towels along balcony/door gaps to trap infiltrating smog.`,
      tag: '₹0 Zero-Cost',
      exposurePct: Math.round(impact.maxExposureDropPct * 0.38),
      co2Kg: 0.1,
    });
  } else if (profile.budgetTier === 'diy_2000') {
    hacks.push({
      id: 'iaq-2',
      title:
        profile.purifier === 'none'
          ? 'DIY Box-Fan + MERV-13/HEPA Filter (~₹1,600)'
          : 'Seal Bedroom Gaps with ₹250 EPDM Foam Tape',
      detail:
        profile.purifier === 'none'
          ? 'Tape a standard MERV-13 filter to the back of a table/exhaust fan to scrub bedroom PM2.5 affordably.'
          : 'Keep your 1-room HEPA in the main sleeping room with doors sealed via self-adhesive EPDM foam tape.',
      tag: 'DIY < ₹2,000',
      exposurePct: Math.round(impact.maxExposureDropPct * 0.4),
      co2Kg: 0.1,
    });
  } else {
    hacks.push({
      id: 'iaq-2',
      title:
        profile.purifier === 'whole_home'
          ? 'Run Whole-Home HEPA on High After 5 PM Inversion'
          : 'Create a Sealed HEPA Clean-Air Bedroom Sanctuary',
      detail:
        profile.purifier === 'none'
          ? 'Prioritize a True HEPA H13 purifier (CADR ≥ 350 m³/h) for the main bedroom.'
          : `Keep your HEPA unit running continuously, especially from ${sealPhrase} through 9:00 AM.`,
      tag: 'HEPA Strategy',
      exposurePct: Math.round(impact.maxExposureDropPct * 0.42),
      co2Kg: 0.1,
    });
  }

  hacks.push({
    id: 'iaq-3',
    title: profile.kitchenExhaust
      ? 'Run Kitchen Exhaust During Tadka & Skip Agarbatti'
      : 'Cover Pots During Tadka & Pause Incense / Coils',
    detail: profile.kitchenExhaust
      ? `Switch on exhaust 2 mins before frying and leave it on 5 mins after. Avoid incense sticks and mosquito coils.`
      : `Without exhaust, frying can spike indoor PM2.5 above 400 µg/m³. Use lids and skip agarbatti today.`,
    tag: 'Indoor Source Cut',
    exposurePct: impact.maxExposureDropPct - hacks[0].exposurePct - hacks[1].exposurePct,
    co2Kg: 0.2,
  });

  return hacks;
}

function buildEmissionSwaps(
  loc: LocationScenario,
  profile: HouseholdProfile,
  vent: VentilationWindow | null,
  impact: CalculatedImpact
): PlaybookItem[] {
  const ventPhrase = vent ? vent.windowLabel : 'midday afternoon';
  const swaps: PlaybookItem[] = [];
  if (profile.commuteMode === 'solo_car') {
    swaps.push({
      id: 'swap-1',
      title: `Take Metro / Bus or Carpool for Your ${impact.km} km Commute`,
      detail: `Skipping a solo car cuts ${impact.commuteCo2Kg} kg CO₂ and keeps ~${Math.round(impact.km * 0.65)}g NOx out of smog. Wear an N95 for the last-mile walk.`,
      tag: `-${impact.commuteCo2Kg} kg CO₂`,
      exposurePct: 0,
      co2Kg: impact.commuteCo2Kg,
    });
  } else if (profile.commuteMode === 'two_wheeler') {
    swaps.push({
      id: 'swap-1',
      title: `Swap ${impact.km} km Two-Wheeler Ride to Metro / AC Bus`,
      detail: `Two-wheeler riders inhale 2–3× more roadside exhaust. Transit saves ${impact.commuteCo2Kg} kg CO₂ and shields lungs.`,
      tag: `-${impact.commuteCo2Kg} kg CO₂`,
      exposurePct: 0,
      co2Kg: impact.commuteCo2Kg,
    });
  } else if (profile.commuteMode === 'public_transit') {
    swaps.push({
      id: 'swap-1',
      title: 'Keep Metro/Bus Routine & Walk/E-Rickshaw Last Mile',
      detail:
        'Your transit choice avoids over 2 kg CO₂ vs driving. Choose an electric e-rickshaw over diesel autos.',
      tag: '-0.65 kg CO₂',
      exposurePct: 0,
      co2Kg: 0.65,
    });
  } else {
    swaps.push({
      id: 'swap-1',
      title: 'Zero-Idling WFH Day + Batched Grocery Orders',
      detail:
        'Avoid short cold-engine runs. Combine errands into one afternoon trip during solar dispersion.',
      tag: '-0.85 kg CO₂',
      exposurePct: 0,
      co2Kg: 0.85,
    });
  }

  swaps.push({
    id: 'swap-2',
    title: `Shift Errands to ${ventPhrase} & Cut Engine Idling`,
    detail: `Morning (6–9 AM) and evening (6–10 PM) have the worst inversion. Batch outdoor errands during the afternoon dip.`,
    tag: 'Peak Smog Dodge',
    exposurePct: 0,
    co2Kg: 0.15,
  });

  swaps.push({
    id: 'swap-3',
    title: 'Use Electric Kettle / Induction & Say No to Open Bonfires',
    detail: `Use an electric kettle or pressure cooker lid to cut indoor NO₂. Remind society watchmen not to burn dry leaves.`,
    tag: 'Clean Energy Swap',
    exposurePct: 0,
    co2Kg: 0.2,
  });

  return swaps;
}

export function buildDeterministicPlaybook(
  loc: LocationScenario,
  profile: HouseholdProfile,
  vent: VentilationWindow | null,
  impact: CalculatedImpact
): PlaybookData {
  const ventPhrase = vent ? vent.windowLabel : 'cleanest midday hours';
  const isSevere = impact.aqi.naqi >= 301;
  const hasVulnerable =
    profile.vulnerabilities.includes('kids') ||
    profile.vulnerabilities.includes('seniors') ||
    profile.vulnerabilities.includes('asthma');

  const healthWhy = `Keeping windows shut outside ${ventPhrase}, wet mopping, and cutting indoor smoke reduces your household inhaled PM2.5 load by roughly ${impact.maxExposureDropPct}% — equal to avoiding ~${impact.maxCigsAvoided} cigarettes/day today.`;
  const emissionWhy = `${impact.commuteSwapLabel} plus cleaner kitchen habits prevents ${impact.totalCo2Kg} kg CO₂ and ~${impact.totalNoxG}g of local NOx from trapping in ${loc.shortCity}'s calm ${loc.wind} km/h winter air.`;
  const vulnerabilityNote = hasVulnerable
    ? `High-Priority Protection (${formatVulnList(profile.vulnerabilities)}): ${
        isSevere
          ? 'Cancel outdoor morning walks/play completely today; use a sealed N95/KF94 if stepping out.'
          : 'Schedule outdoor time strictly between ' + ventPhrase + '.'
      }`
    : `General Household Guidance: Even healthy adults feel throat irritation at NAQI ${impact.aqi.naqi}. Move workouts indoors today.`;

  return {
    iaqHacks: buildIaqHacks(loc, profile, vent, impact),
    emissionSwaps: buildEmissionSwaps(loc, profile, vent, impact),
    explainer: { healthWhy, emissionWhy, vulnerabilityNote },
  };
}
