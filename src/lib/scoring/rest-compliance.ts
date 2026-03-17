import type { DailyMetric } from '@/types';

/**
 * Rest Compliance: count of days where is_rest_day = true in the period.
 * More rest days = higher score (anti-hustle-culture).
 */
export function computeRestCompliance(metrics: DailyMetric[]): number {
  if (metrics.length === 0) return 0;

  return metrics.filter((m) => m.is_rest_day === true).length;
}
