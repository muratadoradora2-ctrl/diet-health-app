"use client";

import { useActionState } from "react";
import { createMeal, type MealFormState } from "./actions";
import { MealFields, type MealTypeKey } from "../meal-fields";

const initialState: MealFormState = {};

export function MealForm({
  defaultDate,
  defaultTime,
  defaultType,
}: {
  defaultDate: string;
  defaultTime: string;
  defaultType: MealTypeKey;
}) {
  const [state, formAction, pending] = useActionState(createMeal, initialState);

  return (
    <form action={formAction} className="card">
      {state.error && <p className="error-text">{state.error}</p>}

      <MealFields defaultDate={defaultDate} defaultTime={defaultTime} defaultType={defaultType} />

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "登録中…" : "登録する"}
      </button>
    </form>
  );
}
