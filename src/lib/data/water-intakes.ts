import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { WaterIntake } from "@/lib/types";

export async function listWaterIntakesBetween(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<WaterIntake[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("water_intakes")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_at", startIso)
    .lt("logged_at", endIso)
    .order("logged_at", { ascending: true });

  if (error) throw new Error("水分摂取データの取得に失敗しました");
  return data ?? [];
}

export async function insertWaterIntake(userId: string, loggedAt: string, volumeMl: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("water_intakes").insert({
    user_id: userId,
    logged_at: loggedAt,
    volume_ml: volumeMl,
  });

  if (error) throw new Error("水分摂取の記録に失敗しました");
}

export async function deleteWaterIntake(userId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("water_intakes")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw new Error("水分摂取の記録の削除に失敗しました");
}
