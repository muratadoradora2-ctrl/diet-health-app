import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { listBodyCompositions } from "@/lib/data/body-compositions";
import { jstDateString, jstTimeString } from "@/lib/date";
import { ExerciseForm } from "../exercise-form";
import { createExerciseAction } from "./actions";

export default async function NewExercisePage() {
  const user = await requireAllowedUser();
  const entries = await listBodyCompositions(user.id);
  const latestWeightKg = entries.length > 0 ? entries[entries.length - 1].weight_kg : null;

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">運動を記録</h1>
      </header>
      <ExerciseForm
        action={createExerciseAction}
        submitLabel="記録する"
        latestWeightKg={latestWeightKg}
        initialValues={{
          exerciseType: "walking",
          date: jstDateString(),
          time: jstTimeString(),
          durationMinutes: null,
          caloriesKcal: null,
          memo: null,
        }}
      />
    </main>
  );
}
