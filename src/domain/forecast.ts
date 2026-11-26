export interface HourlyPm25 {
  time?: string;
  pm25?: number | null;
  pm2_5?: number | null;
}

export interface LowestPm25Window {
  startIndex: number;
  endIndex: number;
  startTime?: string;
  endTime?: string;
  minPm25: number;
  pm25: number;
  averagePm25: number;
  values: readonly number[];
}

export function lowestPm25Window(
  hourly: readonly (number | HourlyPm25)[],
  windowHours: number
): LowestPm25Window | null {
  if (!Number.isInteger(windowHours) || windowHours < 1) return null;
  const values = hourly.map((item) =>
    typeof item === 'number' ? item : (item.pm25 ?? item.pm2_5 ?? null)
  );
  if (values.length < windowHours) return null;
  let bestIndex = -1;
  let bestAverage = Number.POSITIVE_INFINITY;
  for (let start = 0; start <= values.length - windowHours; start += 1) {
    const window = values.slice(start, start + windowHours);
    if (window.some((value) => value === null || !Number.isFinite(value))) continue;
    const numeric = window as number[];
    const average = numeric.reduce((sum, value) => sum + value, 0) / windowHours;
    if (average < bestAverage) {
      bestAverage = average;
      bestIndex = start;
    }
  }
  if (bestIndex < 0) return null;
  const selected = values.slice(bestIndex, bestIndex + windowHours) as number[];
  const min = Math.min(...selected);
  const first = hourly[bestIndex];
  const last = hourly[bestIndex + windowHours - 1];
  return {
    startIndex: bestIndex,
    endIndex: bestIndex + windowHours - 1,
    startTime: typeof first === 'object' ? first.time : undefined,
    endTime: typeof last === 'object' ? last.time : undefined,
    minPm25: min,
    pm25: min,
    averagePm25: bestAverage,
    values: selected,
  };
}
