import React from 'react';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';

interface AuditResultBoxProps {
  auditResult: string | null;
}

export function AuditResultBox({ auditResult }: AuditResultBoxProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-xs text-slate-700 leading-relaxed min-h-[140px]"
    >
      <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1.5">
        {auditResult ? (
          <CheckCircle2 className="w-4 h-4 text-teal-700" />
        ) : (
          <ClipboardCheck className="w-4 h-4 text-teal-700" />
        )}
        <span>Audit Feedback</span>
      </div>
      {auditResult ? (
        <div className="space-y-1.5 whitespace-pre-line">{auditResult}</div>
      ) : (
        <p className="text-slate-500">
          Upload a photo of a window gap, kitchen setup, or mask above. In Basic mode, a physical
          engineering checklist is provided for your chosen focus area.
        </p>
      )}
    </div>
  );
}

interface AuditDropzoneProps {
  previewUrl: string | null;
  fileName: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}

export function AuditDropzone({
  previewUrl,
  fileName,
  onFileChange,
  onRemovePhoto,
}: AuditDropzoneProps) {
  return (
    <div className="relative border-2 border-dashed border-stone-300 hover:border-teal-500 focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600 rounded-2xl p-5 text-center bg-stone-50/70 transition cursor-pointer">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload photo for air quality audit"
      />
      {!previewUrl ? (
        <div className="space-y-1.5 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm mx-auto flex items-center justify-center text-teal-700">
            <span className="text-lg">📷</span>
          </div>
          <div className="text-xs font-semibold text-slate-800">Tap to upload JPEG / PNG photo</div>
          <div className="text-[11px] text-slate-500">
            E.g. sliding window frame, kitchen stove, or N95 mask
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded room or mask audit preview"
            className="max-h-44 mx-auto rounded-xl object-contain border border-stone-200 shadow-sm"
          />
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-slate-600 truncate max-w-[180px]">
              {fileName}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemovePhoto();
              }}
              className="relative z-10 text-xs font-semibold text-rose-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
