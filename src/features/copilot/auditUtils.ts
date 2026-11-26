import type { HouseholdProfile, LocationScenario } from '@/domain/scenarios';

export const FOCUS_AREAS = [
  'Window or Door Gap',
  'Kitchen & Exhaust Setup',
  'Face Mask & Seal Fit',
  'Bedroom / Living Room Layout',
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number];

export interface AuditEvaluation {
  status: string;
  focusArea: string;
  observations: string;
  immediateFix: string;
  impactWhy: string;
  source: string;
  isAiInspected?: boolean;
  timestamp: string;
}

export function resizeImageFile(file: File, maxDim = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function requestPhotoAudit(
  focusArea: string,
  location: LocationScenario,
  profile: HouseholdProfile,
  imageBase64?: string
): Promise<AuditEvaluation> {
  const payload = {
    focusArea,
    city: location.city,
    naqi: location.pm25,
    pm25: location.pm25,
    budgetTier: profile.budgetTier,
    purifier: profile.purifier,
    kitchenExhaust: profile.kitchenExhaust,
    imageBase64: imageBase64?.slice(0, 50000), // send compressed thumbnail
  };

  const res = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Audit service returned HTTP ${res.status}`);
  }

  return (await res.json()) as AuditEvaluation;
}
