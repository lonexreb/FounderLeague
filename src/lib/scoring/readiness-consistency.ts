import type { DailyMetric } from '@/types';

/**
 * Readiness Consistency: 1 / stddev of daily readiness scores.
 * Higher score = more consistent readiness across the period.
 * Returns 0 for empty arrays, 100 for 0 or 1 data points (perfect consistency).
 */
export function computeReadinessConsistency(metrics: DailyMetric[]): number {
  const scores = metrics
    .map((m) => m.readiness_score)
    .filter((s): s is number => s !== null);

  if (scores.length === 0) return 0;
  if (scores.length === 1) return 100;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const stddev = Math.sqrt(variance);

  if (stddev === 0) return 100;

  // Scale: 1/stddev can be very large for tiny variance, so cap at 100
  return Math.min(100, parseFloat((1 / stddev * 100).toFixed(2)));
}
