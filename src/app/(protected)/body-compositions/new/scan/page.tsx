import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { ScanFlow } from "./scan-flow";

// Buffer操作・Anthropic SDKを使うため、Node.jsランタイムを明示する。
export const runtime = "nodejs";

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
