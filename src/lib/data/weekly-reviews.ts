import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WeeklyReview } from "@/lib/ai";

export type WeeklyReviewRow = {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  content: WeeklyReview;
  input_data_hash: string;
  model_used: string;
  created_at: string;
};

/** 読み取りは通常のRLS対応クライアントを使う(本人の行のみ参照可能)。 */
export async function getWeeklyReview(
  userId: string,
  weekStartDate: string,
): Promise<WeeklyReviewRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_ai_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();
  return data ?? null;
}

export async function listRecentWeeklyReviews(
  userId: string,
  limit = 8,
): Promise<WeeklyReviewRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_ai_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error("週次レビューの取得に失敗しました");
  return data ?? [];
}

/**
 * 書き込みはService Role Keyのadminクライアントを使う(weekly_ai_reviewsには
 * 通常ユーザー向けのINSERT/UPDATEポリシーが存在しないため)。
 * 呼び出し元(src/lib/advice/weekly.ts)は必ず事前にrequireAllowedUser()で
 * 認可済みのuserIdだけをここに渡す。
 */
export async function saveWeeklyReview(
  userId: string,
  weekStartDate: string,
  weekEndDate: string,
  review: WeeklyReview,
  inputDataHash: string,
  modelUsed: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("weekly_ai_reviews").upsert(
    {
      user_id: userId,
      week_start_date: weekStartDate,
      week_end_date: weekEndDate,
      content: review,
      input_data_hash: inputDataHash,
      model_used: modelUsed,
    },
    { onConflict: "user_id,week_start_date" },
  );

  if (error) throw new Error("週次レビューの保存に失敗しました");
}
