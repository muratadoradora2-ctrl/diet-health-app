import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getOrGenerateDailyAdvice } from "@/lib/advice/daily";
import { AdviceRefreshButton } from "./advice-refresh-button";

/**
 * <Suspense>配下で独立してデータ取得を行う非同期Server Component。
 * requireAllowedUser()をこのコンポーネント自身でも呼び、ホーム画面の
 * 他の部分とは独立した認可チェックを行う(既存の方針と同じ)。
 */
export async function AdviceCard() {
  const user = await requireAllowedUser();
  const profile = await getOrCreateProfile(user.id, user.email);

  let advice;
  try {
    advice = await getOrGenerateDailyAdvice(user.id, profile.display_name);
  } catch (error) {
    // AIアドバイス生成に失敗しても、ホーム画面全体を壊さない。
    // (体組成・目標などの他の情報は問題なく見られる状態を保つ)
    console.error("daily advice generation failed", error instanceof Error ? error.message : error);
    return null;
  }

  if (!advice) return null;

  return (
    <div className="card advice-card">
      <div className="advice-header">
        <h2 className="card-title">今日のAIアドバイス</h2>
      </div>
      <ul className="advice-points">
        {advice.points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
      <p className="advice-detail">{advice.detail}</p>
      <AdviceRefreshButton />
      <p className="ai-disclaimer">
        ※ このアドバイスはAIによる自動生成です。参考情報としてご利用ください。
      </p>
    </div>
  );
}

export function AdviceCardSkeleton() {
  return (
    <div className="card advice-card">
      <h2 className="card-title">今日のAIアドバイス</h2>
      <p className="lead-note">アドバイスを読み込んでいます…</p>
    </div>
  );
}
