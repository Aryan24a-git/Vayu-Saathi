'use client';

import React, { useState } from 'react';
import { Camera, ScanEye, Loader2 } from 'lucide-react';
import type { LocationScenario, HouseholdProfile } from '@/domain/scenarios';
import { useToast } from '@/features/layout/ToastContainer';
import { FOCUS_AREAS, resizeImageFile, requestPhotoAudit } from './auditUtils';
import { AuditDropzone, AuditResultBox } from './AuditSubcomponents';

interface MultimodalAuditProps {
  location: LocationScenario;
  profile: HouseholdProfile;
}

export function MultimodalAudit({ location, profile }: MultimodalAuditProps) {
  const { showToast } = useToast();
  const [focusArea, setFocusArea] = useState<string>(FOCUS_AREAS[0]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid JPEG, PNG, or WebP image.', 'error');
      return;
    }
    try {
      const resized = await resizeImageFile(file, 800);
      setPreviewUrl(resized);
      setFileName(file.name);
      setAuditResult(null);
    } catch {
      showToast('Could not process image file.', 'error');
    }
  };

  const removePhoto = () => {
    setPreviewUrl(null);
    setFileName('');
    setAuditResult(null);
  };

  const runAudit = async () => {
    if (!previewUrl) {
      showToast('Please upload a photo first.', 'warning');
      return;
    }
    setIsAuditing(true);
    try {
      const result = await requestPhotoAudit(focusArea, location, profile, previewUrl);
      setAuditResult(
        `**Inspection Result for ${result.focusArea}:**\n\n` +
          `• **Visual Observation:** ${result.observations}\n` +
          `• **Immediate Action:** ${result.immediateFix}\n` +
          `• **Health Impact:** ${result.impactWhy}\n\n` +
          `*Engine: ${result.source}*`
      );
      if (result.isAiInspected) {
        showToast('Gemini Vision AI photo analysis complete!', 'success');
      } else {
        showToast('IAQ Checklist generated (Basic mode)', 'info');
      }
    } catch {
      showToast('Backend audit unavailable — using local rules engine.', 'warning');
      setAuditResult(
        `**Inspection Result for ${focusArea}:**\n\n` +
          `• **Visual Observation:** Evaluated against ${location.city}'s outdoor PM2.5 (${location.pm25} µg/m³).\n` +
          `• **Immediate Action:** Keep window/door perimeter tightly sealed outside the safe ventilation window.\n` +
          `• **Health Impact:** Prevents fine particulate infiltration into sleeping quarters.`
      );
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Room / Window / Mask Photo Audit
              </h3>
              <p className="text-[11px] text-slate-500">
                Inspect window gaps, kitchen exhaust, or mask seal fit
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Multimodal
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            What are we auditing?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FOCUS_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setFocusArea(area)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  focusArea === area
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <AuditDropzone
          previewUrl={previewUrl}
          fileName={fileName}
          onFileChange={handleFileChange}
          onRemovePhoto={removePhoto}
        />

        <button
          type="button"
          disabled={!previewUrl || isAuditing}
          onClick={runAudit}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition"
        >
          {isAuditing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ScanEye className="w-4 h-4" />
          )}
          <span>{isAuditing ? 'Inspecting Photo...' : 'Run IAQ Photo Audit'}</span>
        </button>

        <AuditResultBox auditResult={auditResult} />
      </div>

      <div className="text-[11px] text-slate-600 border-t border-stone-100 pt-2.5">
        Photos are resized in-browser and processed ephemerally in memory — never permanently stored
        on any server.
      </div>
    </div>
  );
}
