import type { LocationScenario, CalculatedImpact } from '@/domain/scenarios';
import type { VentilationWindow } from '@/domain/naqi';

export function getChatFallbackReply(
  text: string,
  location: LocationScenario,
  impact: CalculatedImpact,
  vent: VentilationWindow
): string {
  const q = text.toLowerCase();
  if (q.includes('hindi') || q.includes('हिन्दी') || q.includes('samjha')) {
    return (
      `**आज ${location.shortCity} की हवा (CPCB NAQI ${impact.aqi.naqi} — ${impact.aqi.band.label}):**\n\n` +
      `• अभी PM2.5 स्तर **${location.pm25} µg/m³** है, जो बिना बचाव के लगभग **${impact.aqi.cigsPerDay} सिगरेट/दिन** के बराबर है।\n` +
      `• **खिड़कियाँ कब खोलें:** केवल दोपहर **${vent.windowLabel}** के बीच। शाम ${vent.sealLabel} तक बंद कर लें।\n` +
      `• **घर के उपाय:** सूखे झाड़ू की जगह गीला पोछा लगाएँ और तड़का लगाते समय एग्जॉस्ट चलाएँ।`
    );
  }
  if (q.includes('walk') || q.includes('7 am') || q.includes('morning')) {
    return impact.aqi.naqi > 200
      ? `**No — skip the 7:00 AM outdoor walk today.** In ${location.shortCity}, morning inversion traps PM2.5 near ground height.\n\n**Safer swap:** Exercise indoors, or shift walking to **${vent.windowLabel}** with a snug N95 mask.`
      : `At NAQI **${impact.aqi.naqi}**, a light walk is acceptable, though moving it to **${vent.windowLabel}** cuts exposure further.`;
  }
  if (q.includes('seal') || q.includes('window') || q.includes('gap')) {
    return (
      `**Zero-Cost Ways to Seal Bedroom Window & Door Gaps:**\n` +
      `1. **Damp Rolled Cotton Towel:** Wedge a damp rolled towel under bedroom and balcony door gaps.\n` +
      `2. **Cloth/Paper Strips:** Press folded strips into loose sliding window tracks.\n` +
      `3. **Heavy Curtains:** Close thick curtains by **${vent.sealLabel}** to buffer drafts.\n` +
      `4. **Ventilate only at ${vent.windowLabel}:** Cross-ventilate during afternoon solar dispersion.`
    );
  }
  return `In **${location.city}** (NAQI **${impact.aqi.naqi} — ${impact.aqi.band.label}**), keep doors shut outside **${vent.windowLabel}**, wet mop daily, and use public transit to avoid **${impact.totalCo2Kg} kg CO₂** today.`;
}
