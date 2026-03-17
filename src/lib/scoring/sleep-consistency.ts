import type { DailyMetric } from '@/types';

/**
 * Convert an "HH:MM" time string to minutes since midnight.
 * Handles midnight wraparound for bedtimes by treating times before 06:00
 * as next-day (i.e. adding 24 hours), so "01:30" becomes 1530 minutes.
 */
function timeToMinutes(time: string, isForBedtime: boolean): number {
  const [hours, minutes] = time.split(':').map(Number);
  let total = hours * 60 + minutes;

  // For bedtimes, if the time is before 6 AM, treat it as after midnight
  // (e.g., 1:00 AM bedtime = 25 * 60 = 1500 minutes, not 60)
  if (isForBedtime && total < 360) {
    total += 1440; // add 24 hours in minutes
  }

  return total;
}

function stddev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Sleep Consistency: 1/stddev of bedtime and wake time.
 * Average of bedtime consistency and wake time consistency.
 * Higher = more consistent sleep schedule.
 */
export function computeSleepConsistency(metrics: DailyMetric[]): number {
  const bedtimes = metrics
    .map((m) => m.bedtime)
    .filter((t): t is string => t !== null)
    .map((t) => timeToMinutes(t, true));

  const wakeTimes = metrics
    .map((m) => m.wake_time)
    .filter((t): t is string => t !== null)
    .map((t) => timeToMinutes(t, false));

  if (bedtimes.length === 0 && wakeTimes.length === 0) return 0;

  const scores: number[] = [];

  if (bedtimes.length > 1) {
    const sd = stddev(bedtimes);
    scores.push(sd === 0 ? 100 : Math.min(100, (1 / sd) * 100));
  } else if (bedtimes.length === 1) {
    scores.push(100);
  }

  if (wakeTimes.length > 1) {
    const sd = stddev(wakeTimes);
    scores.push(sd === 0 ? 100 : Math.min(100, (1 / sd) * 100));
  } else if (wakeTimes.length === 1) {
    scores.push(100);
  }

  if (scores.length === 0) return 0;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return parseFloat(avg.toFixed(2));
}
