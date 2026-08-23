import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { BottomNav } from "@/components/bottom-nav";

/**
 * このレイアウト配下の全ページは、表示前に必ずrequireAllowedUser()を通過する。
 * Middlewareの判定に依存しない、独立した2段目の認可チェック。
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAllowedUser();
  await getOrCreateProfile(user.id, user.email);

  return (
    <div className="app-shell">
      <div className="app-content">{children}</div>
      <BottomNav />
    </div>
  );
}
