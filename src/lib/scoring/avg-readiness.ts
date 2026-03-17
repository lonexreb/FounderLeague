import type { DailyMetric } from '@/types';

/**
 * Average Readiness: simple mean of readiness scores for the period.
 */
export function computeAvgReadiness(metrics: DailyMetric[]): number {
  const scores = metrics
    .map((m) => m.readiness_score)
    .filter((s): s is number => s !== null);

  if (scores.length === 0) return 0;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return parseFloat(mean.toFixed(2));
}
