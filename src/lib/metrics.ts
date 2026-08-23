import type { BodyComposition, Goal } from "@/lib/types";
import { jstDateString } from "@/lib/date";

export type DashboardMetrics = {
  latest: BodyComposition | null;
  change7d: number | null;
  change30d: number | null;
  changeFromStart: number | null;
  remainingToTarget: number | null;
  achievementPercent: number | null;
};

function findClosestAtOrBefore(
  entriesAsc: BodyComposition[],
  targetDate: Date,
): BodyComposition | null {
  let closest: BodyComposition | null = null;
  for (const entry of entriesAsc) {
    if (new Date(entry.measured_at).getTime() <= targetDate.getTime()) {
      closest = entry;
    } else {
      break;
    }
  }
  return closest;
}

/** entriesAsc は measured_at 昇順であることを前提にする */
export function computeDashboardMetrics(
  entriesAsc: BodyComposition[],
  goal: Goal | null,
): DashboardMetrics {
  const latest = entriesAsc.length > 0 ? entriesAsc[entriesAsc.length - 1] : null;

  if (!latest) {
    return {
      latest: null,
      change7d: null,
      change30d: null,
      changeFromStart: null,
      remainingToTarget: null,
      achievementPercent: null,
    };
  }

  const latestDate = new Date(latest.measured_at);

  const date7 = new Date(latestDate);
  date7.setDate(date7.getDate() - 7);
  const entry7 = findClosestAtOrBefore(entriesAsc, date7);

  const date30 = new Date(latestDate);
  date30.setDate(date30.getDate() - 30);
  const entry30 = findClosestAtOrBefore(entriesAsc, date30);

  const change7d = entry7 ? latest.weight_kg - entry7.weight_kg : null;
  const change30d = entry30 ? latest.weight_kg - entry30.weight_kg : null;

  let changeFromStart: number | null = null;
  let remainingToTarget: number | null = null;
  let achievementPercent: number | null = null;

  if (goal) {
    changeFromStart = latest.weight_kg - goal.start_weight_kg;
    remainingToTarget = latest.weight_kg - goal.target_weight_kg;

    const totalToLose = goal.start_weight_kg - goal.target_weight_kg;
    if (totalToLose !== 0) {
      const progressed = goal.start_weight_kg - latest.weight_kg;
      achievementPercent = Math.min(100, Math.max(0, (progressed / totalToLose) * 100));
    }
  }

  return { latest, change7d, change30d, changeFromStart, remainingToTarget, achievementPercent };
}

export type MovingAveragePoint = {
  date: string;
  value: number | null;
  average: number | null;
};

type NumericMetricField = "weight_kg" | "body_fat_percent" | "muscle_mass_kg";

/**
 * 同日に複数の記録がある場合は、measured_at昇順の入力を前提に最後の値を採用する。
 * 「同日」はJST基準で判定する(measured_atはUTCのISO文字列のため、単純に
 * 先頭10文字を切り出すと、JSTの朝の記録がUTC上は前日扱いになってしまう)。
 */
function toDailySeries(
  entriesAsc: BodyComposition[],
  field: NumericMetricField,
): { date: string; value: number }[] {
  const byDate = new Map<string, number>();
  for (const entry of entriesAsc) {
    const value = entry[field];
    if (value === null || value === undefined) continue;
    byDate.set(jstDateString(new Date(entry.measured_at)), value);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export function buildMovingAverageSeries(
  entriesAsc: BodyComposition[],
  field: NumericMetricField,
  windowSize = 7,
): MovingAveragePoint[] {
  const daily = toDailySeries(entriesAsc, field);

  return daily.map((point, index) => {
    const windowStart = Math.max(0, index - windowSize + 1);
    const window = daily.slice(windowStart, index + 1);
    const average = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    return { date: point.date, value: point.value, average };
  });
}
