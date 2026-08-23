import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MenstrualCycle } from "@/lib/types";

/**
 * このテーブルへのアクセスは常に通常のRLS対応クライアント経由。
 * auth.uid() = user_id の行のみ返る(Service Role Keyは一切使わない)。
 * 配偶者のuser_idではこのクエリを実行しても常に0件になる。
 */
export async function listMenstrualCycles(
  userId: string,
  limit?: number,
): Promise<MenstrualCycle[]> {
  const supabase = await createClient();
  let query = supabase
    .from("menstrual_cycles")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error("生理周期データの取得に失敗しました");
  return data ?? [];
}

export async function getMenstrualCycleById(
  userId: string,
  id: string,
): Promise<MenstrualCycle | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menstrual_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export type MenstrualCycleInput = {
  startDate: string;
  endDate?: string | null;
  memo?: string | null;
};

export async function insertMenstrualCycle(userId: string, input: MenstrualCycleInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("menstrual_cycles").insert({
    user_id: userId,
    start_date: input.startDate,
    end_date: input.endDate ?? null,
    memo: input.memo ?? null,
  });

  if (error) throw new Error("生理周期の記録に失敗しました");
}

export async function updateMenstrualCycle(
  userId: string,
  id: string,
  input: MenstrualCycleInput,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menstrual_cycles")
    .update({
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      memo: input.memo ?? null,
    })
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw new Error("生理周期の更新に失敗しました");
}

export async function deleteMenstrualCycle(userId: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menstrual_cycles")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw new Error("生理周期の削除に失敗しました");
}
