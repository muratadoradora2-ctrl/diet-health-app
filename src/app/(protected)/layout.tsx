import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

/**
 * このレイアウト配下の全ページは、表示前に必ずrequireAllowedUser()を通過する。
 * Middlewareの判定に依存しない、独立した2段目の認可チェック。
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAllowedUser();
  return <>{children}</>;
}
