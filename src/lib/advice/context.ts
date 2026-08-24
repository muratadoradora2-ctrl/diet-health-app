import "server-only";
import { createHash } from "node:crypto";
import { getActiveGoal } from "@/lib/data/goals";
import { listBodyCompositions } from "@/lib/data/body-compositions";
import { listMealsBetween } from "@/lib/data/meals";
import { listExercisesBetween } from "@/lib/data/exercises";
import { computeDashboardMetrics } from "@/lib/metrics";
import { jstDateString, jstDayRangeToISOStrings } from "@/lib/date";
import type { DailyAdviceContext } from "@/lib/ai";

/** 直近の体組成記録から、日付ごとの最新値を昇順で最大7件抽出する */
function buildRecentWeights(
  entriesAsc: { measured_at: string; weight_kg: number }[],
): { date: string; weightKg: number }[] {
  const byDate = new Map<string, number>();
  for (const entry of entriesAsc) {
    byDate.set(jstDateString(new Date(entry.measured_at)), entry.weight_kg);
  }
  const sorted = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
  return sorted.slice(-7).map(([date, weightKg]) => ({ date, weightKg }));
}

export type DailyAdviceContextResult = {
  context: DailyAdviceContext;
  inputDataHash: string;
};

/**
 * 日次AIアドバイス生成に必要なデータをまとめて取得する。
 * 併せて、キャッシュ判定用のハッシュ(SHA-256)を計算する。
 * ハッシュは体組成・目標・本日の食事のうち「内容が変わったら再生成すべき」
 * 最小限の識別子(id + 更新日時)だけから作る。
 */
export async function buildDailyAdviceContext(
  userId: string,
  displayName: string,
): Promise<DailyAdviceContextResult> {
  const since = new Date();
  since.setDate(since.getDate() - 35);

  const todayStr = jstDateString();
  const { startIso, endIso } = jstDayRangeToISOStrings(todayStr);

  const [goal, entries, todaysMeals, todaysExercises] = await Promise.all([
    getActiveGoal(userId),
    listBodyCompositions(userId, since.toISOString()),
    listMealsBetween(userId, startIso, endIso),
    listExercisesBetween(userId, startIso, endIso),
  ]);

  const metrics = computeDashboardMetrics(entries, goal);
  const latest = metrics.latest;

  const context: DailyAdviceContext = {
    displayName,
    today: {
      latestWeightKg: latest?.weight_kg ?? null,
      latestMeasuredAt: latest?.measured_at ?? null,
      bodyFatPercent: latest?.body_fat_percent ?? null,
    },
    change7dKg: metrics.change7d,
    change30dKg: metrics.change30d,
    goal: goal
      ? {
          startWeightKg: goal.start_weight_kg,
          targetWeightKg: goal.target_weight_kg,
          targetDate: goal.target_date,
        }
      : null,
    recentWeights: buildRecentWeights(entries),
    todaysMeals: todaysMeals.map((meal) => ({
      mealType: meal.meal_type,
      text: meal.input_text,
      caloriesKcal: meal.estimated_calories_kcal,
    })),
    todaysExerciseMinutes: todaysExercises.reduce((sum, ex) => sum + ex.duration_minutes, 0),
    todaysExerciseCaloriesKcal:
      todaysExercises.length > 0
        ? todaysExercises.reduce((sum, ex) => sum + (ex.estimated_calories_kcal ?? 0), 0)
        : null,
  };

  const hashInput = JSON.stringify({
    latestBodyComp: latest ? { id: latest.id, measuredAt: latest.measured_at } : null,
    goal: goal ? { id: goal.id, updatedAt: goal.updated_at } : null,
    meals: todaysMeals
      .map((meal) => ({ id: meal.id, updatedAt: meal.updated_at }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    exercises: todaysExercises
      .map((ex) => ({ id: ex.id, updatedAt: ex.updated_at }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  });
  const inputDataHash = createHash("sha256").update(hashInput).digest("hex");

  return { context, inputDataHash };
}
