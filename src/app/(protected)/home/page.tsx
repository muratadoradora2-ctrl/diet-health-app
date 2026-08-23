import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getActiveGoal } from "@/lib/data/goals";
import { listBodyCompositions } from "@/lib/data/body-compositions";
import { computeDashboardMetrics } from "@/lib/metrics";

function formatKg(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1);
}

function formatSignedKg(value: number | null) {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} kg`;
}

export default async function HomePage() {
  const user = await requireAllowedUser();

  const since = new Date();
  since.setDate(since.getDate() - 35);

  const [goal, entries] = await Promise.all([
    getActiveGoal(user.id),
    listBodyCompositions(user.id, since.toISOString()),
  ]);

  const metrics = computeDashboardMetrics(entries, goal);
  const { latest } = metrics;

  return (
    <main className="page">
      <header className="page-header">
        <p className="page-eyebrow">
          {new Date().toLocaleDateString("ja-JP", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </p>
        <h1 className="page-title">ホーム</h1>
      </header>

      {!latest ? (
        <div className="card stack">
          <p>まだ体組成の記録がありません。まずは今日の数値を登録しましょう。</p>
          <Link href="/body-compositions/new" className="button-primary">
            今日の体組成を登録
          </Link>
        </div>
      ) : (
        <>
          <div className="card hero-card">
            <div className="hero-stat">
              <span className="hero-value">{formatKg(latest.weight_kg)}</span>
              <span className="hero-unit">kg</span>
            </div>
            <p className="hero-date">
              測定{" "}
              {new Date(latest.measured_at).toLocaleString("ja-JP", {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="stat-row">
              <div>
                <p className="stat-label">体脂肪率</p>
                <p className="stat-value">
                  {formatPercent(latest.body_fat_percent)}
                  <span className="stat-unit"> %</span>
                </p>
              </div>
              <div>
                <p className="stat-label">筋肉量</p>
                <p className="stat-value">
                  {formatKg(latest.muscle_mass_kg)}
                  <span className="stat-unit"> kg</span>
                </p>
              </div>
            </div>
            <Link href="/body-compositions/new" className="button-secondary">
              今日の体組成を登録
            </Link>
          </div>

          {goal ? (
            <div className="card">
              <h2 className="card-title">目標までの進捗</h2>
              <div className="goal-flow">
                <div>
                  <p className="stat-label">開始時</p>
                  <p className="stat-value-sm">{formatKg(goal.start_weight_kg)}kg</p>
                </div>
                <span className="goal-arrow">→</span>
                <div>
                  <p className="stat-label">現在</p>
                  <p className="stat-value-sm">{formatKg(latest.weight_kg)}kg</p>
                </div>
                <span className="goal-arrow">→</span>
                <div>
                  <p className="stat-label">目標</p>
                  <p className="stat-value-sm">{formatKg(goal.target_weight_kg)}kg</p>
                </div>
              </div>

              {metrics.achievementPercent !== null && (
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${metrics.achievementPercent}%` }}
                  />
                </div>
              )}

              <div className="stat-row">
                <div>
                  <p className="stat-label">開始からの変化</p>
                  <p className="stat-value-sm">{formatSignedKg(metrics.changeFromStart)}</p>
                </div>
                <div>
                  <p className="stat-label">目標まで</p>
                  <p className="stat-value-sm">
                    {metrics.remainingToTarget === null
                      ? "—"
                      : metrics.remainingToTarget <= 0
                        ? "達成しました"
                        : `あと ${metrics.remainingToTarget.toFixed(1)} kg`}
                  </p>
                </div>
                {goal.target_date && (
                  <div>
                    <p className="stat-label">目標日</p>
                    <p className="stat-value-sm">
                      {new Date(goal.target_date).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card stack">
              <p>目標を設定すると、進捗を確認できるようになります。</p>
              <Link href="/goals" className="button-secondary">
                目標を設定する
              </Link>
            </div>
          )}

          <div className="card stack">
            <h2 className="card-title">直近の変化</h2>
            <div className="stat-row">
              <div>
                <p className="stat-label">7日間</p>
                <p className="stat-value-sm">{formatSignedKg(metrics.change7d)}</p>
              </div>
              <div>
                <p className="stat-label">30日間</p>
                <p className="stat-value-sm">{formatSignedKg(metrics.change30d)}</p>
              </div>
            </div>
            <p className="lead-note">
              日々の増減より、7日〜30日の傾向を見ることを大切にしましょう。
            </p>
            <Link href="/graphs" className="button-secondary">
              グラフで見る
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
