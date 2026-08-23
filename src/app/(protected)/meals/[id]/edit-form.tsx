"use client";

import { useActionState } from "react";
import { updateMealAction, deleteMealAction, type MealFormState } from "./actions";
import { MealFields } from "../meal-fields";
import { jstDateString, jstTimeString } from "@/lib/date";
import type { Meal } from "@/lib/types";

const initialState: MealFormState = {};

export function EditMealForm({ meal }: { meal: Meal }) {
  const [state, formAction, pending] = useActionState(updateMealAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteMealAction,
    initialState,
  );

  const eatenAt = new Date(meal.eaten_at);

  return (
    <>
      <form action={formAction} className="card">
        <input type="hidden" name="id" value={meal.id} />
        {state.error && <p className="error-text">{state.error}</p>}

        <MealFields
          defaultDate={jstDateString(eatenAt)}
          defaultTime={jstTimeString(eatenAt)}
          defaultType={meal.meal_type}
          defaultText={meal.input_text ?? ""}
        />

        <button className="button-primary" type="submit" disabled={pending}>
          {pending ? "保存中…" : "保存する"}
        </button>
      </form>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm("この食事の記録を削除します。よろしいですか?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={meal.id} />
        {deleteState.error && <p className="error-text">{deleteState.error}</p>}
        <button className="button-danger" type="submit" disabled={deletePending}>
          {deletePending ? "削除中…" : "この記録を削除する"}
        </button>
      </form>
    </>
  );
}
