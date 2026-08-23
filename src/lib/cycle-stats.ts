import type { MenstrualCycle } from "@/lib/types";

/**
 * date型(YYYY-MM-DD)の文字列同士の日数計算・加算。タイムゾーンの影響を
 * 受けないよう、formatDateOnly(src/lib/date.ts)と同じくローカルの
 * Dateコンストラクタで組み立てる。
 */
function daysBetween(startDate: string, endDate: string): number {
  const [ay, am, ad] = startDate.split("-").map(Number);
  const [by, bm, bd] = endDate.split("-").map(Number);
  const a = new Date(ay, am - 1, ad);
  const b = new Date(by, bm - 1, bd);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export type CycleStats = {
  averageCycleLengthDays: number | null;
  averagePeriodLengthDays: number | null;
  predictedNextStartDate: string | null;
};

/** 直近何回分の周期間隔を平均に使うか(古い記録に引っ張られすぎないため) */
const MAX_INTERVALS_FOR_AVERAGE = 6;

export function computeCycleStats(cycles: MenstrualCycle[]): CycleStats {
  const asc = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));

  const intervals: number[] = [];
  for (let i = 1; i < asc.length; i++) {
    intervals.push(daysBetween(asc[i - 1].start_date, asc[i].start_date));
  }
  const recentIntervals = intervals.slice(-MAX_INTERVALS_FOR_AVERAGE);
  const averageCycleLengthDays =
    recentIntervals.length > 0
      ? Math.round(recentIntervals.reduce((sum, v) => sum + v, 0) / recentIntervals.length)
      : null;

  const periodLengths = asc
    .filter((cycle) => cycle.end_date !== null)
    .map((cycle) => daysBetween(cycle.start_date, cycle.end_date as string) + 1)
    .filter((v) => v > 0);
  const averagePeriodLengthDays =
    periodLengths.length > 0
      ? Math.round(periodLengths.reduce((sum, v) => sum + v, 0) / periodLengths.length)
      : null;

  const lastCycle = asc[asc.length - 1];
  const predictedNextStartDate =
    lastCycle && averageCycleLengthDays !== null
      ? addDays(lastCycle.start_date, averageCycleLengthDays)
      : null;

  return { averageCycleLengthDays, averagePeriodLengthDays, predictedNextStartDate };
}
