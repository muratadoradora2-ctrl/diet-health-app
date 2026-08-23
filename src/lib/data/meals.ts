import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Meal } from "@/lib/types";

export async function listMealsBetween(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<Meal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .gte("eaten_at", startIso)
    .lt("eaten_at", endIso)
    .order("eaten_at", { ascending: true });

  if (error) throw new Error("食事データの取得に失敗しました");
  return data ?? [];
}

export async function getMealById(userId: string, id: string): Promise<Meal | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export type MealInput = {
  eatenAt: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  inputText: string;
  estimatedCaloriesKcal?: number | null;
  estimatedProteinG?: number | null;
  estimatedFatG?: number | null;
  estimatedCarbsG?: number | null;
  estimatedFiberG?: number | null;
  isAiEstimated: boolean;
};

export async function insertMeal(userId: string, input: MealInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").insert({
    user_id: userId,
    eaten_at: input.eatenAt,
    meal_type: input.mealType,
    input_text: input.inputText,
    estimated_calories_kcal: input.estimatedCaloriesKcal ?? null,
    estimated_protein_g: input.estimatedProteinG ?? null,
    estimated_fat_g: input.estimatedFatG ?? null,
    estimated_carbs_g: input.estimatedCarbsG ?? null,
    estimated_fiber_g: input.estimatedFiberG ?? null,
    is_ai_estimated: input.isAiEstimated,
  });

  if (error) throw new Error("食事の登録に失敗しました");
}

/**
 * 編集画面からの更新は、内容がどう変わったかを厳密に追跡していないため、
 * 一律 user_adjusted = true として保存する(AI推定でなかった行では未使用の値)。
 */
export async function updateMeal(userId: string, id: string, input: MealInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meals")
    .update({
      eaten_at: input.eatenAt,
      meal_type: input.mealType,
      input_text: input.inputText,
      estimated_calories_kcal: input.estimatedCaloriesKcal ?? null,
      estimated_protein_g: input.estimatedProteinG ?? null,
      estimated_fat_g: input.estimatedFatG ?? null,
      estimated_carbs_g: input.estimatedCarbsG ?? null,
      estimated_fiber_g: input.estimatedFiberG ?? null,
      is_ai_estimated: input.isAiEstimated,
      user_adjusted: true,
    })
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw new Error("食事の更新に失敗しました");
}

export async function deleteMeal(userId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").delete().eq("user_id", userId).eq("id", id);

  if (error) throw new Error("食事の削除に失敗しました");
}
