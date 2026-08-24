"use client";

import { useActionState } from "react";
import { updateExerciseAction, deleteExerciseAction, type DeleteExerciseState } from "./actions";
import { ExerciseForm } from "../exercise-form";
import { jstDateString, jstTimeString } from "@/lib/date";
import type { Exercise } from "@/lib/types";

const initialState: DeleteExerciseState = {};

export function EditExerciseForm({
  exercise,
  latestWeightKg,
}: {
  exercise: Exercise;
  latestWeightKg: number | null;
}) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteExerciseAction,
    initialState,
  );

  const performedAt = new Date(exercise.performed_at);

  return (
    <>
      <ExerciseForm
        action={updateExerciseAction}
        exerciseId={exercise.id}
        submitLabel="保存する"
        latestWeightKg={latestWeightKg}
        initialValues={{
          exerciseType: exercise.exercise_type,
          date: jstDateString(performedAt),
          time: jstTimeString(performedAt),
          durationMinutes: exercise.duration_minutes,
          caloriesKcal: exercise.estimated_calories_kcal,
          memo: exercise.memo,
        }}
      />

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm("この運動の記録を削除します。よろしいですか?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={exercise.id} />
        {deleteState.error && <p className="error-text">{deleteState.error}</p>}
        <button className="button-danger" type="submit" disabled={deletePending}>
          {deletePending ? "削除中…" : "この記録を削除する"}
        </button>
      </form>
    </>
  );
}
