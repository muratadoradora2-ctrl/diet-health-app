import "server-only";
import { getAIProvider } from "@/lib/ai";
import { getWeeklyReview, saveWeeklyReview } from "@/lib/data/weekly-reviews";
import { buildWeeklyReviewContext } from "./weekly-context";
import { jstMostRecentCompletedWeek } from "@/lib/date";
import { checkRateLimit } from "@/lib/rate-limit";

export type WeeklyReviewView = {
  summary: string;
  goodPoints: string[];
  focusNextWeek: string[];
  modelUsed: string;
  weekStartDate: string;
  weekEndDate: string;
};

/**
 * 直近の「完了した週」(月〜日)のAIレビューを取得する。
 *   - その週に体組成の記録が1件も無い場合は、AI呼び出し自体を行わずnullを返す。
 *   - 入力データのハッシュがキャッシュと一致する場合はAIを呼ばずキャッシュを返す。
 *   - forceRegenerate=true の場合は、ハッシュが一致していても再生成する
 *     (「レビューを更新」ボタン用)。
 */
export async function getOrGenerateWeeklyReview(
  userId: string,
  displayName: string,
  forceRegenerate = false,
): Promise<WeeklyReviewView | null> {
  const { startDate, endDate } = jstMostRecentCompletedWeek();
  const { context, inputDataHash } = await buildWeeklyReviewContext(
    userId,
    displayName,
    startDate,
    endDate,
  );

  if (context.daysWithBodyCompLog === 0) {
    return null;
  }

  const cached = await getWeeklyReview(userId, startDate);
  if (cached && !forceRegenerate && cached.input_data_hash === inputDataHash) {
    return {
      summary: cached.content.summary,
      goodPoints: cached.content.goodPoints,
      focusNextWeek: cached.content.focusNextWeek,
      modelUsed: cached.model_used,
      weekStartDate: cached.week_start_date,
      weekEndDate: cached.week_end_date,
    };
  }

  if (!forceRegenerate) {
    // 自動生成経路にも上限を設ける。手動更新(forceRegenerate)は呼び出し元
    // (refreshWeeklyReview)が既にレート制限を確認済みのため、ここでは
    // 二重にカウントしない。
    const rateLimit = await checkRateLimit(userId, "weekly-review", {
      limit: 10,
      windowSeconds: 60 * 60 * 24,
    });
    if (!rateLimit.success) {
      if (cached) {
        return {
          summary: cached.content.summary,
          goodPoints: cached.content.goodPoints,
          focusNextWeek: cached.content.focusNextWeek,
          modelUsed: cached.model_used,
          weekStartDate: cached.week_start_date,
          weekEndDate: cached.week_end_date,
        };
      }
      return null;
    }
  }

  const provider = getAIProvider();
  const { review, modelUsed } = await provider.generateWeeklyReview(context);

  await saveWeeklyReview(userId, startDate, endDate, review, inputDataHash, modelUsed);

  return {
    summary: review.summary,
    goodPoints: review.goodPoints,
    focusNextWeek: review.focusNextWeek,
    modelUsed,
    weekStartDate: startDate,
    weekEndDate: endDate,
  };
}
