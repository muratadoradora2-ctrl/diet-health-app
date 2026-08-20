import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { signOut } from "../actions";

export default async function HomePage() {
  // layout.tsxで既に確認済みだが、このページ単独でも独立して検証する
  // （Server Component/Server Actionは常にrequireAllowedUser()を自分で
  // 呼ぶ、という原則を崩さないための例）。
  const user = await requireAllowedUser();

  return (
    <main style={{ flex: 1, padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ fontSize: "1.3rem", marginBottom: 8 }}>ようこそ</h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: 4 }}>
          {user.email} としてログイン中です。
        </p>
        <p style={{ color: "var(--ink-soft)", marginBottom: 20 }}>
          この画面が表示されていれば、認証・allowlist・RLSの基本設定が正しく動作しています。体組成・食事・グラフなどの機能はPhase
          3以降で追加していきます。
        </p>
        <form action={signOut}>
          <button className="button-secondary" type="submit">
            ログアウト
          </button>
        </form>
      </div>
    </main>
  );
}
