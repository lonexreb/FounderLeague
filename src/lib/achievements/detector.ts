import type { DailyMetric, AchievementType } from '@/types';

export function detectAchievements(metrics: DailyMetric[]): AchievementType[] {
  const earned: AchievementType[] = [];

  if (metrics.length === 0) return earned;

  // Sort by date ascending
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 7-Day Streak: readiness > 70 for 7 consecutive days
  let streak = 0;
  for (const m of sorted) {
    if (m.readiness_score && m.readiness_score > 70) {
      streak++;
      if (streak >= 7) {
        earned.push('7_day_streak');
        break;
      }
    } else {
      streak = 0;
    }
  }

  // Perfect Rest Week: at least 2 rest days in any 7-day window
  for (let i = 0; i <= sorted.length - 7; i++) {
    const window = sorted.slice(i, i + 7);
    const restDays = window.filter((m) => m.is_rest_day).length;
    if (restDays >= 2) {
      earned.push('perfect_rest');
      break;
    }
  }

  // ACWR Master: 30 days in optimal zone
  // Requires enough data for ACWR calculation (28+ days)
  if (sorted.length >= 28) {
    let optimalDays = 0;
    for (let i = 27; i < sorted.length; i++) {
      const acute = sorted.slice(i - 6, i + 1);
      const chronic = sorted.slice(i - 27, i + 1);

      const acuteAvg =
        acute.reduce((sum, m) => sum + (m.strain_score || m.activity_score || 0), 0) /
        acute.length;
      const chronicAvg =
        chronic.reduce((sum, m) => sum + (m.strain_score || m.activity_score || 0), 0) /
        chronic.length;

      if (chronicAvg > 0) {
        const acwr = acuteAvg / chronicAvg;
        if (acwr >= 0.8 && acwr <= 1.3) {
          optimalDays++;
        }
      }
    }
    if (optimalDays >= 30) {
      earned.push('acwr_master');
    }
  }

  // Sleep Champion: average 8+ hours for 14 days
  if (sorted.length >= 14) {
    for (let i = 0; i <= sorted.length - 14; i++) {
      const window = sorted.slice(i, i + 14);
      const withSleep = window.filter((m) => m.sleep_duration_hours !== null);
      if (withSleep.length >= 14) {
        const avg =
          withSleep.reduce((sum, m) => sum + (m.sleep_duration_hours || 0), 0) /
          withSleep.length;
        if (avg >= 8) {
          earned.push('sleep_champion');
          break;
        }
      }
    }
  }

  // Recovery King: return to baseline within 48hrs after peak strain
  const withReadiness = sorted.filter((m) => m.readiness_score !== null);
  if (withReadiness.length >= 7) {
    const baseline =
      withReadiness.reduce((sum, m) => sum + (m.readiness_score || 0), 0) /
      withReadiness.length;

    // Find peak strain days (top quartile)
    const withStrain = sorted.filter(
      (m) => m.strain_score !== null || m.activity_score !== null
    );
    if (withStrain.length >= 4) {
      const strainValues = withStrain
        .map((m) => m.strain_score || m.activity_score || 0)
        .sort((a, b) => b - a);
      const threshold = strainValues[Math.floor(strainValues.length * 0.25)];

      for (const m of sorted) {
        const strain = m.strain_score || m.activity_score || 0;
        if (strain >= threshold) {
          // Check next 2 days
          const idx = sorted.indexOf(m);
          const next = sorted.slice(idx + 1, idx + 3);
          const recovered = next.some(
            (n) => n.readiness_score && n.readiness_score >= baseline * 0.95
          );
          if (recovered) {
            earned.push('recovery_king');
            break;
          }
        }
      }
    }
  }

  // Deload Discipline: full 7-day window with strain below 60% of average
  if (sorted.length >= 14) {
    const allStrain = sorted
      .filter((m) => m.strain_score !== null || m.activity_score !== null)
      .map((m) => m.strain_score || m.activity_score || 0);

    if (allStrain.length >= 14) {
      const avgStrain = allStrain.reduce((a, b) => a + b, 0) / allStrain.length;
      const deloadThreshold = avgStrain * 0.6;

      for (let i = 0; i <= sorted.length - 7; i++) {
        const window = sorted.slice(i, i + 7);
        const allBelow = window.every((m) => {
          const s = m.strain_score || m.activity_score || 0;
          return s <= deloadThreshold;
        });
        if (allBelow) {
          earned.push('deload_discipline');
          break;
        }
      }
    }
  }

  return [...new Set(earned)];
}
