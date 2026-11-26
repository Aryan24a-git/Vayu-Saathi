'use client';

import React from 'react';

export function CostFilter({
  showPaid,
  onChange,
}: {
  showPaid: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={showPaid}
        onChange={(event) => onChange(event.target.checked)}
      />
      Show paid options
    </label>
  );
}
