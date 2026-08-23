import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { listMenstrualCycles } from "@/lib/data/menstrual-cycles";
import { computeCycleStats } from "@/lib/cycle-stats";
import { formatDateOnly } from "@/lib/date";

export default async function CyclesPage() {
  const user = await requireAllowedUser();
  const profile = await getOrCreateProfile(user.id, user.email);

  if (!profile.menstrual_tracking_enabled) {
    return (
      <main className="page">
        <header className="page-header">
          <h1 className="page-title">生理管理</h1>
        </header>
        <div className="card stack">
          <p className="lead-note">
            この機能はまだ有効になっていません。「その他」画面のプロフィール設定から有効にできます。
          </p>
          <Link href="/more" className="button-secondary">
            その他画面へ
          </Link>
        </div>
      </main>
    );
  }

  const cycles = await listMenstrualCycles(user.id);
  const stats = computeCycleStats(cycles);

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">生理管理</h1>
      </header>

      <Link href="/cycles/new" className="button-primary">
        記録を追加
      </Link>

      {cycles.length > 0 && (
        <div className="card stack">
          <h2 className="card-title">周期の傾向</h2>
          {stats.averageCycleLengthDays !== null ? (
            <p className="lead-note">平均周期: 約{stats.averageCycleLengthDays}日</p>
          ) : (
            <p className="lead-note">周期の平均を出すには、記録があと1回以上必要です。</p>
          )}
          {stats.averagePeriodLengthDays !== null && (
            <p className="lead-note">平均期間: 約{stats.averagePeriodLengthDays}日</p>
          )}
          {stats.predictedNextStartDate !== null && (
            <p className="lead-note">
              次回開始予測: {formatDateOnly(stats.predictedNextStartDate)}頃
            </p>
          )}
          <p className="ai-disclaimer">
            ※ 過去の記録から機械的に算出した目安です。医療的な判断には使用しないでください。
          </p>
        </div>
      )}

      {cycles.length === 0 ? (
        <p className="lead-note">まだ記録がありません。</p>
      ) : (
        <ul className="history-list">
          {cycles.map((cycle) => (
            <li key={cycle.id}>
              <Link href={`/cycles/${cycle.id}`} className="card history-item">
                <div>
                  <p className="history-date">
                    {formatDateOnly(cycle.start_date)}
                    {cycle.end_date ? ` 〜 ${formatDateOnly(cycle.end_date)}` : " 〜(継続中)"}
                  </p>
                  {cycle.memo && <p className="history-sub">{cycle.memo}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
