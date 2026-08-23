import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyAdvice } from "@/lib/ai";

export type DailyAdviceRow = {
  id: string;
  user_id: string;
  advice_date: string;
  content: DailyAdvice;
  input_data_hash: string;
  model_used: string;
  updated_at: string;
};

/** 読み取りは通常のRLS対応クライアントを使う(本人の行のみ参照可能)。 */
export async function getDailyAdvice(
  userId: string,
  adviceDate: string,
): Promise<DailyAdviceRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_ai_advice")
    .select("*")
    .eq("user_id", userId)
    .eq("advice_date", adviceDate)
    .maybeSingle();
  return data ?? null;
}

/**
 * 書き込みはService Role Keyのadminクライアントを使う(daily_ai_adviceには
 * 通常ユーザー向けのINSERT/UPDATEポリシーが存在しないため)。
 * 呼び出し元(src/lib/advice/daily.ts)は必ず事前にrequireAllowedUser()で
 * 認可済みのuserIdだけをここに渡す。
 */
export async function saveDailyAdvice(
  userId: string,
  adviceDate: string,
  advice: DailyAdvice,
  inputDataHash: string,
  modelUsed: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("daily_ai_advice").upsert(
    {
      user_id: userId,
      advice_date: adviceDate,
      content: advice,
      input_data_hash: inputDataHash,
      model_used: modelUsed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,advice_date" },
  );

  if (error) throw new Error("AIアドバイスの保存に失敗しました");
}
