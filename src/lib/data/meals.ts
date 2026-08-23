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
};

/**
 * Phase 5時点ではテキスト入力のみ。AI栄養推定(estimated_*)はPhase 6で
 * 写真入力とあわせて実装するため、ここでは null のまま保存する。
 */
export async function insertMeal(userId: string, input: MealInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").insert({
    user_id: userId,
    eaten_at: input.eatenAt,
    meal_type: input.mealType,
    input_text: input.inputText,
    is_ai_estimated: false,
  });

  if (error) throw new Error("食事の登録に失敗しました");
}

export async function updateMeal(userId: string, id: string, input: MealInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meals")
    .update({
      eaten_at: input.eatenAt,
      meal_type: input.mealType,
      input_text: input.inputText,
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
