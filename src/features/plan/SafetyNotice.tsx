import React from 'react';
import { AlertCircle } from 'lucide-react';

export function SafetyNotice({ redFlagCopy }: { redFlagCopy: string }) {
  return (
    <aside
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950"
    >
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-bold">Health and emergency notice</h2>
          <p className="mt-1">
            {redFlagCopy ||
              'For severe breathlessness, chest pain, blue lips, confusion, or similar warning signs, seek immediate medical care.'}
          </p>
          <p className="mt-1">
            This app provides information only, not medical advice or diagnosis.
          </p>
        </div>
      </div>
    </aside>
  );
}
