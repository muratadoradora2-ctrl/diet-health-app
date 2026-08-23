import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getOrGenerateWeeklyReview } from "@/lib/advice/weekly";
import { listRecentWeeklyReviews } from "@/lib/data/weekly-reviews";
import { formatDateOnly } from "@/lib/date";
import { ReviewRefreshButton } from "./review-refresh-button";

/**
 * <Suspense>配下で独立してデータ取得を行う非同期Server Component。
 * requireAllowedUser()をこのコンポーネント自身でも呼び、独立した認可チェックを行う。
 */
export async function ReviewCard() {
  const user = await requireAllowedUser();
  const profile = await getOrCreateProfile(user.id, user.email);

  let review;
  try {
    review = await getOrGenerateWeeklyReview(user.id, profile.display_name);
  } catch (error) {
    console.error(
      "weekly review generation failed",
      error instanceof Error ? error.message : error,
    );
    review = null;
  }

  const pastReviews = (await listRecentWeeklyReviews(user.id, 8)).filter(
    (row) => row.week_start_date !== review?.weekStartDate,
  );

  return (
    <div className="stack">
      {review ? (
        <div className="card advice-card">
          <div className="advice-header">
            <h2 className="card-title">
              週次レビュー({formatDateOnly(review.weekStartDate)}〜
              {formatDateOnly(review.weekEndDate)})
            </h2>
          </div>
          <p className="advice-detail">{review.summary}</p>

          <p className="review-subheading">良かった点</p>
          <ul className="advice-points">
            {review.goodPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>

          <p className="review-subheading">来週に向けて</p>
          <ul className="advice-points">
            {review.focusNextWeek.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>

          <ReviewRefreshButton />
          <p className="ai-disclaimer">
            ※ このレビューはAIによる自動生成です。参考情報としてご利用ください。
          </p>
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">週次レビュー</h2>
          <p className="lead-note">
            直近の週(月〜日)に体組成の記録がまだ無いため、レビューはまだ作成されていません。
          </p>
        </div>
      )}

      {pastReviews.length > 0 && (
        <div className="card stack">
          <h2 className="card-title">過去のレビュー</h2>
          <ul className="review-list">
            {pastReviews.map((row) => (
              <li key={row.id} className="review-list-item">
                <p className="review-week-range">
                  {formatDateOnly(row.week_start_date)}〜{formatDateOnly(row.week_end_date)}
                </p>
                <p className="lead-note">{row.content.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="card advice-card">
      <h2 className="card-title">週次レビュー</h2>
      <p className="lead-note">レビューを読み込んでいます…</p>
    </div>
  );
}
