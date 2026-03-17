import type { DailyMetric } from '@/types';
import { parseISO, differenceInHours } from 'date-fns';

/**
 * Recovery Speed: after peak strain periods (top quartile of strain days),
 * measure how many hours until readiness returns to the personal baseline
 * (30-day rolling average).
 *
 * Score = 100 - avg_recovery_hours. Higher = faster recovery.
 * Clamped to [0, 100].
 */
export function computeRecoverySpeed(metrics: DailyMetric[]): number {
  if (metrics.length === 0) return 0;

  const sorted = [...metrics].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  // Calculate personal baseline: 30-day average readiness
  const readinessScores = sorted
    .map((m) => m.readiness_score)
    .filter((s): s is number => s !== null);

  if (readinessScores.length === 0) return 0;

  const baseline =
    readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length;

  // Find top quartile strain threshold
  const strainScores = sorted
    .map((m) => m.strain_score)
    .filter((s): s is number => s !== null)
    .sort((a, b) => a - b);

  if (strainScores.length < 4) return 0;

  const q3Index = Math.floor(strainScores.length * 0.75);
  const topQuartileThreshold = strainScores[q3Index];

  // Find peak strain days and measure recovery time
  const recoveryHours: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const metric = sorted[i];
    if (metric.strain_score === null || metric.strain_score < topQuartileThreshold) {
      continue;
    }

    const peakDate = parseISO(metric.date);

    // Look forward for readiness returning to baseline
    for (let j = i + 1; j < sorted.length; j++) {
      if (
        sorted[j].readiness_score !== null &&
        sorted[j].readiness_score! >= baseline
      ) {
        const recoveryDate = parseISO(sorted[j].date);
        const hours = differenceInHours(recoveryDate, peakDate);
        recoveryHours.push(hours);
        break;
      }
    }
  }

  if (recoveryHours.length === 0) return 0;

  const avgHours =
    recoveryHours.reduce((a, b) => a + b, 0) / recoveryHours.length;

  return parseFloat(Math.max(0, Math.min(100, 100 - avgHours)).toFixed(2));
}
