import React from 'react';
import type { NormalizedPlan } from './usePlan';
import { ActionCard } from './ActionCard';

const slots = ['morning', 'daytime', 'evening', 'night', 'any'] as const;

export function TodayTab({
  plan,
  onAsk,
}: {
  plan: NormalizedPlan;
  onAsk?: (question: string) => void;
}) {
  return (
    <div className="space-y-4">
      {plan.routineWindow && (
        <p className="rounded-lg bg-blue-50 p-3 text-sm">
          Lowest forecast PM2.5 window: {plan.routineWindow}
        </p>
      )}
      {slots.map((slot) => {
        const items = plan.routine.filter(
          (item) =>
            item.timeOfDay === slot ||
            (slot === 'any' && !slots.includes(item.timeOfDay as (typeof slots)[number]))
        );
        if (!items.length) return null;
        return (
          <section key={slot} aria-labelledby={`slot-${slot}`}>
            <h2 id={`slot-${slot}`} className="mb-2 text-sm font-bold capitalize">
              {slot}
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <ActionCard key={item.action.id} item={item} onAskAboutAction={onAsk} />
              ))}
            </div>
          </section>
        );
      })}
      {plan.routine.length === 0 && (
        <p className="rounded-lg border p-4 text-sm text-slate-600">
          No extra routine actions are needed for the current conditions.
        </p>
      )}
    </div>
  );
}
