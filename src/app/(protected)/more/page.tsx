import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { signOut } from "../actions";
import { ProfileForm } from "./profile-form";

export default async function MorePage() {
  const user = await requireAllowedUser();
  const profile = await getOrCreateProfile(user.id, user.email);

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">その他</h1>
      </header>

      <div className="card stack">
        <div>
          <h2 className="card-title">プロフィール</h2>
          <p className="lead-note">{user.email}</p>
        </div>
        <ProfileForm displayName={profile.display_name} />
      </div>

      <ul className="menu-list">
        <li>
          <Link href="/goals" className="menu-item">
            目標設定
          </Link>
        </li>
        <li>
          <Link href="/reviews" className="menu-item">
            週次AIレビュー
          </Link>
        </li>
        <li>
          <span className="menu-item disabled">生理管理(準備中)</span>
        </li>
      </ul>

      <form action={signOut}>
        <button className="button-secondary" type="submit">
          ログアウト
        </button>
      </form>
    </main>
  );
}
