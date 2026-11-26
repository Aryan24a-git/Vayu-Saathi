export const CHART_W = 560;
export const CHART_H = 200;
export const PAD_L = 40;
export const PAD_R = 40;
export const PAD_T = 24;
export const PAD_B = 30;

export function getChartX(idx: number): number {
  return PAD_L + (idx / 23) * (CHART_W - PAD_L - PAD_R);
}

export function getChartY(val: number, max: number): number {
  return PAD_T + (1 - val / max) * (CHART_H - PAD_T - PAD_B);
}

export function buildPolylinePoints(data: number[], max: number): string {
  return data.map((v, i) => `${getChartX(i)},${getChartY(v, max)}`).join(' ');
}
