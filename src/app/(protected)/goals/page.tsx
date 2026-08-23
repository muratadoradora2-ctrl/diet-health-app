import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getActiveGoal } from "@/lib/data/goals";
import { jstDateString } from "@/lib/date";
import { GoalForm } from "./form";

export default async function GoalsPage() {
  const user = await requireAllowedUser();
  const goal = await getActiveGoal(user.id);

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">目標設定</h1>
      </header>
      <GoalForm goal={goal} defaultDate={jstDateString()} />
    </main>
  );
}
