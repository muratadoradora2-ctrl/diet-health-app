import { redirect } from "next/navigation";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { jstDateString } from "@/lib/date";
import { CycleForm } from "../cycle-form";
import { createCycleAction } from "./actions";

export default async function NewCyclePage() {
  const user = await requireAllowedUser();
  const profile = await getOrCreateProfile(user.id, user.email);
  if (!profile.menstrual_tracking_enabled) {
    redirect("/more");
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">生理周期を記録</h1>
      </header>
      <CycleForm
        action={createCycleAction}
        submitLabel="記録する"
        initialValues={{ startDate: jstDateString() }}
      />
    </main>
  );
}
