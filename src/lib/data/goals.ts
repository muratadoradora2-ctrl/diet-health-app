import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/lib/types";

export async function getActiveGoal(userId: string): Promise<Goal | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

export type GoalInput = {
  startDate: string;
  startWeightKg: number;
  targetWeightKg: number;
  targetBodyFatPercent?: number | null;
  targetDate?: string | null;
};

/**
 * 目標は履歴として残すため、既存のアクティブな目標は非アクティブ化してから
 * 新しい行を追加する(goals_one_active_per_userのUNIQUE制約に対応するため)。
 */
export async function saveGoal(userId: string, input: GoalInput) {
  const supabase = await createClient();

  await supabase
    .from("goals")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  const { error } = await supabase.from("goals").insert({
    user_id: userId,
    start_date: input.startDate,
    start_weight_kg: input.startWeightKg,
    target_weight_kg: input.targetWeightKg,
    target_body_fat_percent: input.targetBodyFatPercent ?? null,
    target_date: input.targetDate ?? null,
    is_active: true,
  });

  if (error) throw new Error("目標の保存に失敗しました");
}
