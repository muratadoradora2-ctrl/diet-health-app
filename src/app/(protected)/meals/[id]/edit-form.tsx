"use client";

import { useActionState } from "react";
import { updateMealAction, deleteMealAction, type MealFormState } from "./actions";
import { MealEntryForm } from "../meal-entry-form";
import { jstDateString, jstTimeString } from "@/lib/date";
import type { Meal } from "@/lib/types";

const initialState: MealFormState = {};

export function EditMealForm({ meal }: { meal: Meal }) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteMealAction,
    initialState,
  );

  const eatenAt = new Date(meal.eaten_at);

  return (
    <>
      <MealEntryForm
        action={updateMealAction}
        mealId={meal.id}
        aiNotice={meal.is_ai_estimated}
        submitLabel="保存する"
        initialValues={{
          mealType: meal.meal_type,
          date: jstDateString(eatenAt),
          time: jstTimeString(eatenAt),
          text: meal.input_text ?? "",
          caloriesKcal: meal.estimated_calories_kcal,
          proteinG: meal.estimated_protein_g,
          fatG: meal.estimated_fat_g,
          carbsG: meal.estimated_carbs_g,
          isAiEstimated: meal.is_ai_estimated,
        }}
      />

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
