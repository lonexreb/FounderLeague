import type { DailyMetric, LeaderboardCategory } from '@/types';
import { parseISO, isWithinInterval, addDays } from 'date-fns';

import { computeReadinessConsistency } from './readiness-consistency';
import { computeAvgReadiness } from './avg-readiness';
import { computeSleepConsistency } from './sleep-consistency';
import { computeAcwrManagement } from './acwr-management';
import { computeRestCompliance } from './rest-compliance';
import { computeReadinessStreak } from './readiness-streak';
import { computeRecoverySpeed } from './recovery-speed';
import { computeTlsManagement } from './tls-management';

export {
  computeReadinessConsistency,
  computeAvgReadiness,
  computeSleepConsistency,
  computeAcwrManagement,
  computeRestCompliance,
  computeReadinessStreak,
  computeRecoverySpeed,
  computeTlsManagement,
};

/**
 * Compute all leaderboard scores for a user given their daily metrics.
 *
 * @param metrics - Full set of daily metrics (may span more than one week for
 *   algorithms like ACWR that need historical context).
 * @param weekStart - ISO date string (YYYY-MM-DD) for the scoring week start.
 *   Algorithms that only care about the current week will filter to
 *   [weekStart, weekStart + 7 days). Algorithms needing historical data
 *   (ACWR, recovery speed, TLS) receive the full metrics array.
 */
export function computeAllScores(
  metrics: DailyMetric[],
  weekStart: string
): Record<LeaderboardCategory, number> {
  const start = parseISO(weekStart);
  const end = addDays(start, 7);

  // Filter metrics to just the scoring week for week-scoped algorithms
  const weekMetrics = metrics.filter((m) => {
    const date = parseISO(m.date);
    return isWithinInterval(date, { start, end: addDays(end, -1) });
  });

  return {
    readiness_consistency: computeReadinessConsistency(weekMetrics),
    avg_readiness: computeAvgReadiness(weekMetrics),
    sleep_consistency: computeSleepConsistency(weekMetrics),
    acwr_management: computeAcwrManagement(metrics), // needs 28-day history
    rest_compliance: computeRestCompliance(weekMetrics),
    readiness_streak: computeReadinessStreak(weekMetrics),
    recovery_speed: computeRecoverySpeed(metrics), // needs historical data
    tls_management: computeTlsManagement(weekMetrics),
  };
}
