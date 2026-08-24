import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DailySteps } from "@/lib/types";

export async function getDailySteps(userId: string, logDate: string): Promise<DailySteps | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_steps")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .maybeSingle();
  return data ?? null;
}

/** 歩数は1日1値の上書き型。同じ日に何度保存しても、その日の最新値に置き換わる。 */
export async function upsertDailySteps(userId: string, logDate: string, steps: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("daily_steps").upsert(
    {
      user_id: userId,
      log_date: logDate,
      steps,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,log_date" },
  );

  if (error) throw new Error("歩数の保存に失敗しました");
}
