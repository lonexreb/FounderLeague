import type { DailyMetric } from '@/types';

/**
 * Total Life Stress (TLS) Management.
 *
 * For each day, compute a stress composite (0-100) from three factors:
 *  - Strain stress: strain_score normalized (assumes 0-21 scale, mapped to 0-100)
 *  - Sleep stress: 100 if sleep_duration_hours < 7, 0 otherwise
 *  - HRV stress: 100 if hrv_avg < personal baseline (mean HRV), 0 otherwise
 *
 * TLS per day = mean of available stress factors.
 * Final score = 100 - mean(daily TLS). Higher = lower stress = better.
 */
export function computeTlsManagement(metrics: DailyMetric[]): number {
  if (metrics.length === 0) return 0;

  // Calculate personal HRV baseline
  const hrvValues = metrics
    .map((m) => m.hrv_avg)
    .filter((v): v is number => v !== null);
  const hrvBaseline =
    hrvValues.length > 0
      ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length
      : null;

  const dailyTls: number[] = [];

  for (const metric of metrics) {
    const factors: number[] = [];

    // Strain stress (normalize strain from 0-21 scale to 0-100)
    if (metric.strain_score !== null) {
      factors.push(Math.min(100, (metric.strain_score / 21) * 100));
    }

    // Sleep stress: penalize < 7 hours
    if (metric.sleep_duration_hours !== null) {
      factors.push(metric.sleep_duration_hours < 7 ? 100 : 0);
    }

    // HRV stress: below personal baseline
    if (metric.hrv_avg !== null && hrvBaseline !== null) {
      factors.push(metric.hrv_avg < hrvBaseline ? 100 : 0);
    }

    if (factors.length > 0) {
      dailyTls.push(factors.reduce((a, b) => a + b, 0) / factors.length);
    }
  }

  if (dailyTls.length === 0) return 0;

  const meanTls = dailyTls.reduce((a, b) => a + b, 0) / dailyTls.length;
  return parseFloat(Math.max(0, Math.min(100, 100 - meanTls)).toFixed(2));
}
