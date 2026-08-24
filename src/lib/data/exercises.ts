import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";

export async function listExercisesBetween(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .gte("performed_at", startIso)
    .lt("performed_at", endIso)
    .order("performed_at", { ascending: true });

  if (error) throw new Error("運動データの取得に失敗しました");
  return data ?? [];
}

export async function getExerciseById(userId: string, id: string): Promise<Exercise | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export type ExerciseInput = {
  performedAt: string;
  exerciseType: string;
  durationMinutes: number;
  estimatedCaloriesKcal?: number | null;
  memo?: string | null;
};

export async function insertExercise(userId: string, input: ExerciseInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").insert({
    user_id: userId,
    performed_at: input.performedAt,
    exercise_type: input.exerciseType,
    duration_minutes: input.durationMinutes,
    estimated_calories_kcal: input.estimatedCaloriesKcal ?? null,
    memo: input.memo ?? null,
  });

  if (error) throw new Error("運動の登録に失敗しました");
}

export async function updateExercise(userId: string, id: string, input: ExerciseInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .update({
      performed_at: input.performedAt,
      exercise_type: input.exerciseType,
      duration_minutes: input.durationMinutes,
      estimated_calories_kcal: input.estimatedCaloriesKcal ?? null,
      memo: input.memo ?? null,
    })
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw new Error("運動の更新に失敗しました");
}

export async function deleteExercise(userId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw new Error("運動の削除に失敗しました");
}
