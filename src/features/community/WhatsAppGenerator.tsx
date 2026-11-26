'use client';

import React, { useState, useMemo } from 'react';
import { MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import type { LocationScenario, CalculatedImpact } from '@/domain/scenarios';
import type { VentilationWindow } from '@/domain/naqi';
import { useToast } from '@/features/layout/ToastContainer';
import { WhatsAppPreview } from './WhatsAppPreview';

interface WhatsAppGeneratorProps {
  location: LocationScenario;
  vent: VentilationWindow | null;
  impact: CalculatedImpact;
}

function getDeterministicBulletin(
  targetLang: 'en' | 'hi',
  name: string,
  location: LocationScenario,
  vent: VentilationWindow | null,
  impact: CalculatedImpact
) {
  const aqi = impact.aqi;
  const cleanName = name.trim() || `${location.shortCity} Residents Welfare Group`;
  const hiVentLine = vent
    ? `💨 *सुरक्षित वेंटिलेशन समय:* केवल *${vent.windowLabel}* के बीच खिड़कियाँ खोलें। शाम *${vent.sealLabel}* तक बंद रखें।`
    : `💨 *सुरक्षित वेंटिलेशन:* प्रति-घंटा पूर्वानुमान उपलब्ध नहीं है — धुंध रहने तक खिड़कियाँ बंद रखें।`;
  const enVentLine = vent
    ? `🪟 *Safe Ventilation Window:* Open windows only during *${vent.windowLabel}*. Seal doors/windows by *${vent.sealLabel}*.`
    : `🪟 *Ventilation Guidance:* Hourly forecast unavailable — keep windows sealed while outdoor haze remains high.`;

  if (targetLang === 'hi') {
    return (
      `🌿 *${cleanName} — आज का वायु स्वास्थ्य अलर्ट (VayuSaathi)*\n\n` +
      `📍 *क्षेत्र:* ${location.city}\n` +
      `📊 *CPCB NAQI:* *${aqi.naqi} (${aqi.band.label})* | PM2.5: ${location.pm25} µg/m³\n` +
      `${hiVentLine}\n\n` +
      `✅ *आज के 2 सामुदायिक संकल्प:*\n` +
      `1️⃣ *खुले में आग न जलाएँ:* कृपया गार्ड्स व सफाई कर्मियों से अनुरोध करें कि सूखे पत्ते या कचरा न जलाएँ — शांत हवा (${location.wind} km/h) में धुआँ यहीं फँस जाता है।\n` +
      `2️⃣ *कम-उत्सर्जन आवागमन:* आज अकेले कार निकालने के बजाय मेट्रो/कारपूल अपनाएँ और सूखे झाड़ू की जगह गीला पोछा लगाएँ।\n\n` +
      `🤝 आइए मिलकर अपनी कॉलोनी की हवा सुरक्षित रखें!`
    );
  }

  return (
    `🌿 *${cleanName} — Daily Smog & Clean Air Bulletin (VayuSaathi)*\n\n` +
    `📍 *Area:* ${location.city}\n` +
    `📊 *CPCB NAQI:* *${aqi.naqi} (${aqi.band.label})* | PM2.5: ${location.pm25} µg/m³ (~${aqi.cigsPerDay} cigs/day eq.)\n` +
    `${enVentLine}\n\n` +
    `✅ *Today's 2 Community Pledges:*\n` +
    `1️⃣ *Zero Biomass / Leaf Burning:* Please remind society night guards & sweepers not to burn dry leaves or waste tonight — calm ${location.wind} km/h winds trap smoke at breathing level.\n` +
    `2️⃣ *Smarter Commute & Wet Mopping:* Swap solo car runs for Metro/carpool where possible, avoid engine idling at our main gate, and switch from dry sweeping to wet mopping today.\n\n` +
    `🤝 Small coordinated habits cut our colony's local smog together!`
  );
}

export function WhatsAppGenerator({ location, vent, impact }: WhatsAppGeneratorProps) {
  const { showToast } = useToast();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [rwaName, setRwaName] = useState('Green Park / Residents Welfare Group');
  const [customBulletin, setCustomBulletin] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  const defaultBulletin = useMemo(
    () => getDeterministicBulletin(lang, rwaName, location, vent, impact),
    [lang, rwaName, location, vent, impact]
  );
  const bulletinText = customBulletin ?? defaultBulletin;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bulletinText);
      showToast('WhatsApp bulletin copied to clipboard!', 'success');
    } catch {
      showToast('Could not copy automatically — please select and copy.', 'error');
    }
  };

  const handleDraftWithAI = async () => {
    setIsDrafting(true);
    try {
      const res = await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          rwaName,
          city: location.city,
          shortCity: location.shortCity,
          wind: location.wind,
          pm25: location.pm25,
          naqi: impact.aqi.naqi,
          bandLabel: impact.aqi.band.label,
          cigsPerDay: impact.aqi.cigsPerDay,
          windowLabel: vent?.windowLabel ?? 'Midday window (hourly unavailable)',
          sealLabel: vent?.sealLabel ?? 'Evening inversion',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomBulletin(data.bulletinText);
        showToast('Generated fresh RWA advisory!', 'success');
      } else {
        setCustomBulletin(null);
        showToast('Generated advisory from local engine.', 'success');
      }
    } catch {
      setCustomBulletin(null);
      showToast('Generated advisory from local engine.', 'success');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">1-Tap WhatsApp RWA Bulletin</h3>
              <p className="text-[11px] text-slate-500">
                Share factual smog timing &amp; anti-burning alerts
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                lang === 'en'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                lang === 'hi'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={rwaName}
            onChange={(e) => setRwaName(e.target.value)}
            placeholder="Enter your Society / RWA name..."
            className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
          />
          <button
            type="button"
            disabled={isDrafting}
            onClick={handleDraftWithAI}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition shrink-0 disabled:opacity-50"
          >
            {isDrafting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate with AI</span>
          </button>
        </div>

        <WhatsAppPreview bulletinText={bulletinText} lang={lang} onCopy={handleCopy} />
      </div>
    </div>
  );
}
