export function communityEstimateText(
  households: number,
  low: number,
  high: number,
  unit: string
): string {
  return `Estimate for ${households} households: ${low}–${high} ${unit}. Assumes the stated adoption range and catalog evidence.`;
}
