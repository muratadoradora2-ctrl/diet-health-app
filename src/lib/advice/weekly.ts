import "server-only";
import { getAIProvider } from "@/lib/ai";
import { getWeeklyReview, saveWeeklyReview, type WeeklyReviewRow } from "@/lib/data/weekly-reviews";
import { buildWeeklyReviewContext } from "./weekly-context";
import { jstMostRecentCompletedWeek } from "@/lib/date";
import { checkRateLimit } from "@/lib/rate-limit";
import type { WeeklyReview } from "@/lib/ai";

export type WeeklyReviewView = {
  summary: string;
  goodPoints: string[];
  focusNextWeek: string[];
  exerciseSuggestion: string;
  dietTip: string;
  modelUsed: string;
  weekStartDate: string;
  weekEndDate: string;
};

function toView(
  review: WeeklyReview,
  modelUsed: string,
  weekStartDate: string,
  weekEndDate: string,
): WeeklyReviewView {
  return { ...review, modelUsed, weekStartDate, weekEndDate };
}

function rowToView(row: WeeklyReviewRow): WeeklyReviewView {
  return toView(row.content, row.model_used, row.week_start_date, row.week_end_date);
}

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
    return rowToView(cached);
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
      return cached ? rowToView(cached) : null;
    }
  }

  const provider = getAIProvider();
  const { review, modelUsed } = await provider.generateWeeklyReview(context);

  await saveWeeklyReview(userId, startDate, endDate, review, inputDataHash, modelUsed);

  return toView(review, modelUsed, startDate, endDate);
}
