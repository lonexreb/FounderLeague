import type { DailyMetric } from '@/types';
import { parseISO } from 'date-fns';

/**
 * Readiness Streak: longest consecutive run of days where readiness_score > 70.
 * Metrics are sorted by date to ensure proper streak detection.
 */
export function computeReadinessStreak(metrics: DailyMetric[]): number {
  if (metrics.length === 0) return 0;

  const sorted = [...metrics].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  let longestStreak = 0;
  let currentStreak = 0;

  for (const metric of sorted) {
    if (metric.readiness_score !== null && metric.readiness_score > 70) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return longestStreak;
}
