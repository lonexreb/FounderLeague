import type { DailyMetric } from '@/types';
import { parseISO, differenceInDays } from 'date-fns';

/**
 * ACWR Management: percentage of days where the Acute:Chronic Workload Ratio
 * falls within the optimal range [0.8, 1.3].
 *
 * Acute load = average strain over last 7 days.
 * Chronic load = average strain over last 28 days.
 * ACWR = acute / chronic.
 *
 * Requires at least 28 days of data to compute meaningful ACWR.
 * Score = percentage of eligible days in the sweet spot (0-100).
 */
export function computeAcwrManagement(metrics: DailyMetric[]): number {
  // Sort by date ascending
  const sorted = metrics
    .filter((m) => m.strain_score !== null)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  if (sorted.length < 28) return 0;

  let daysInZone = 0;
  let eligibleDays = 0;

  for (let i = 27; i < sorted.length; i++) {
    const currentDate = parseISO(sorted[i].date);

    // Collect the last 28 days of data ending at sorted[i]
    const last28: number[] = [];
    const last7: number[] = [];

    for (let j = i; j >= 0; j--) {
      const dayDate = parseISO(sorted[j].date);
      const daysAgo = differenceInDays(currentDate, dayDate);

      if (daysAgo > 27) break;
      if (sorted[j].strain_score !== null) {
        last28.push(sorted[j].strain_score!);
        if (daysAgo < 7) {
          last7.push(sorted[j].strain_score!);
        }
      }
    }

    if (last7.length === 0 || last28.length === 0) continue;

    const acute = last7.reduce((a, b) => a + b, 0) / last7.length;
    const chronic = last28.reduce((a, b) => a + b, 0) / last28.length;

    if (chronic === 0) continue;

    const acwr = acute / chronic;
    eligibleDays++;

    if (acwr >= 0.8 && acwr <= 1.3) {
      daysInZone++;
    }
  }

  if (eligibleDays === 0) return 0;

  return parseFloat(((daysInZone / eligibleDays) * 100).toFixed(2));
}
