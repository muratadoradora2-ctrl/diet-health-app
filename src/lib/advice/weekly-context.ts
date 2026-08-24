import "server-only";
import { createHash } from "node:crypto";
import { getActiveGoal } from "@/lib/data/goals";
import { listBodyCompositionsBetween } from "@/lib/data/body-compositions";
import { listMealsBetween } from "@/lib/data/meals";
import { listExercisesBetween } from "@/lib/data/exercises";
import { daysBetweenDates, jstDateString, jstDayRangeToISOStrings } from "@/lib/date";
import type { WeeklyReviewContext } from "@/lib/ai";

export type WeeklyReviewContextResult = {
  context: WeeklyReviewContext;
  inputDataHash: string;
};

/**
 * 週次AIレビュー生成に必要なデータをまとめて取得する。
 * weekStartDate/weekEndDateは共にJSTのYYYY-MM-DD(月曜〜日曜)。
 */
export async function buildWeeklyReviewContext(
  userId: string,
  displayName: string,
  weekStartDate: string,
  weekEndDate: string,
): Promise<WeeklyReviewContextResult> {
  const { startIso } = jstDayRangeToISOStrings(weekStartDate);
  const { endIso } = jstDayRangeToISOStrings(weekEndDate);

  const [goal, entries, meals, exercises] = await Promise.all([
    getActiveGoal(userId),
    listBodyCompositionsBetween(userId, startIso, endIso),
    listMealsBetween(userId, startIso, endIso),
    listExercisesBetween(userId, startIso, endIso),
  ]);

  const daysWithBodyCompLog = new Set(
    entries.map((entry) => jstDateString(new Date(entry.measured_at))),
  ).size;
  const weightStartKg = entries.length > 0 ? entries[0].weight_kg : null;
  const weightEndKg = entries.length > 0 ? entries[entries.length - 1].weight_kg : null;
  const weightChangeKg =
    weightStartKg !== null && weightEndKg !== null
      ? Number((weightEndKg - weightStartKg).toFixed(2))
      : null;
  const avgWeightKg =
    entries.length > 0
      ? Number((entries.reduce((sum, e) => sum + e.weight_kg, 0) / entries.length).toFixed(2))
      : null;

  const daysWithMealLog = new Set(meals.map((meal) => jstDateString(new Date(meal.eaten_at))))
    .size;
  const mealsWithCalories = meals.filter((meal) => meal.estimated_calories_kcal !== null);
  const avgCaloriesKcal =
    mealsWithCalories.length > 0 && daysWithMealLog > 0
      ? Math.round(
          mealsWithCalories.reduce((sum, m) => sum + (m.estimated_calories_kcal ?? 0), 0) /
            daysWithMealLog,
        )
      : null;

  const context: WeeklyReviewContext = {
    displayName,
    weekStartDate,
    weekEndDate,
    weightStartKg,
    weightEndKg,
    weightChangeKg,
    avgWeightKg,
    daysWithBodyCompLog,
    goal: goal
      ? {
          startWeightKg: goal.start_weight_kg,
          targetWeightKg: goal.target_weight_kg,
          targetDate: goal.target_date,
        }
      : null,
    avgCaloriesKcal,
    daysWithMealLog,
    totalMealsLogged: meals.length,
    daysWithExerciseLog: new Set(
      exercises.map((ex) => jstDateString(new Date(ex.performed_at))),
    ).size,
    totalExerciseMinutes: exercises.reduce((sum, ex) => sum + ex.duration_minutes, 0),
    remainingWeightKg:
      goal && weightEndKg !== null
        ? Number((weightEndKg - goal.target_weight_kg).toFixed(2))
        : null,
    daysUntilTargetDate: goal?.target_date
      ? daysBetweenDates(weekEndDate, goal.target_date)
      : null,
  };

  const hashInput = JSON.stringify({
    entries: entries.map((entry) => ({ id: entry.id, measuredAt: entry.measured_at })),
    meals: meals
      .map((meal) => ({ id: meal.id, updatedAt: meal.updated_at }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    exercises: exercises
      .map((ex) => ({ id: ex.id, updatedAt: ex.updated_at }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    goal: goal ? { id: goal.id, updatedAt: goal.updated_at } : null,
  });
  const inputDataHash = createHash("sha256").update(hashInput).digest("hex");

  return { context, inputDataHash };
}
