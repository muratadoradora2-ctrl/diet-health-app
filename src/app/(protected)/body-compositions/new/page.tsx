import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { jstDateString, jstTimeString } from "@/lib/date";
import { BodyCompositionForm } from "./form";

export default async function NewBodyCompositionPage() {
  await requireAllowedUser();

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">体組成を登録</h1>
      </header>
      <BodyCompositionForm defaultDate={jstDateString()} defaultTime={jstTimeString()} />
    </main>
  );
}
