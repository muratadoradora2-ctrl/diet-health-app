import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { listBodyCompositions } from "@/lib/data/body-compositions";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function BodyCompositionsPage() {
  const user = await requireAllowedUser();
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const entries = await listBodyCompositions(user.id, since.toISOString());
  const sorted = [...entries].reverse();

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">体組成</h1>
      </header>

      <Link href="/body-compositions/new" className="button-primary">
        今日の体組成を登録
      </Link>

      {sorted.length === 0 ? (
        <p className="lead-note">まだ記録がありません。</p>
      ) : (
        <ul className="history-list">
          {sorted.map((entry) => (
            <li key={entry.id} className="card history-item">
              <div>
                <p className="history-date">{formatDateTime(entry.measured_at)}</p>
                <p className="history-weight">{entry.weight_kg.toFixed(1)} kg</p>
              </div>
              <div className="history-sub">
                {entry.body_fat_percent !== null && (
                  <span>体脂肪 {entry.body_fat_percent.toFixed(1)}%</span>
                )}
                {entry.muscle_mass_kg !== null && (
                  <span>筋肉量 {entry.muscle_mass_kg.toFixed(1)}kg</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
