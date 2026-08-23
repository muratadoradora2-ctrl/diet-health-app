import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export default async function NewBodyCompositionPage() {
  await requireAllowedUser();

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">体組成を登録</h1>
      </header>

      <Link href="/body-compositions/new/scan" className="button-primary">
        スクリーンショットで登録
      </Link>
      <p className="lead-note">
        体組成計アプリのスクリーンショットをAIが読み取り、数値を自動入力します。
      </p>

      <Link href="/body-compositions/new/manual" className="button-secondary">
        手入力で登録
      </Link>
    </main>
  );
}
