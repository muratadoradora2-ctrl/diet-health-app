import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { ScanFlow } from "./scan-flow";

export default async function ScanBodyCompositionPage() {
  await requireAllowedUser();

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">スクリーンショットで登録</h1>
      </header>
      <ScanFlow />
    </main>
  );
}
