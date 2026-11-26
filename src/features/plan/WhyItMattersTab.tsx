import React from 'react';
import type { NormalizedPlan } from './usePlan';

export function WhyItMattersTab({ plan }: { plan: NormalizedPlan }) {
  const personal = [...plan.routine, ...plan.indoors].filter(
    (item) =>
      item.action.impact.benefitType === 'personal_exposure' ||
      item.action.impact.benefitType === 'both'
  );
  const emissions = [...plan.routine, ...plan.indoors, ...plan.alternatives].filter(
    (item) =>
      item.action.impact.benefitType === 'emissions' || item.action.impact.benefitType === 'both'
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border p-4">
        <h2 className="font-bold">For your family&apos;s breathing</h2>
        {personal.length ? (
          personal.map((item) => (
            <p key={item.action.id} className="mt-2 text-sm">
              {item.action.shortDescription}: {item.action.impact.magnitudeDescription}
            </p>
          ))
        ) : (
          <p className="mt-2 text-sm">No personal-exposure actions are selected.</p>
        )}
      </section>
      <section className="rounded-xl border p-4">
        <h2 className="font-bold">For the neighborhood&apos;s emissions</h2>
        {emissions.length ? (
          emissions.map((item) => (
            <p key={item.action.id} className="mt-2 text-sm">
              {item.action.shortDescription}: {item.action.impact.magnitudeDescription}
            </p>
          ))
        ) : (
          <p className="mt-2 text-sm">No emissions actions are selected.</p>
        )}
      </section>
    </div>
  );
}
