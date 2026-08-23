"use client";

import { useActionState } from "react";
import type { Goal } from "@/lib/types";
import { upsertGoalAction, type GoalFormState } from "./actions";

const initialState: GoalFormState = {};

export function GoalForm({
  goal,
  defaultDate,
}: {
  goal: Goal | null;
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(upsertGoalAction, initialState);

  return (
    <form action={formAction} className="card">
      {state.error && <p className="error-text">{state.error}</p>}

      <div className="field">
        <label htmlFor="startDate">ダイエット開始日</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={goal?.start_date ?? defaultDate}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="startWeightKg">
          開始時体重 <span className="field-unit">(kg)</span>
        </label>
        <input
          id="startWeightKg"
          name="startWeightKg"
          type="number"
          inputMode="decimal"
          step="0.1"
          defaultValue={goal?.start_weight_kg}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="targetWeightKg">
          目標体重 <span className="field-unit">(kg)</span>
        </label>
        <input
          id="targetWeightKg"
          name="targetWeightKg"
          type="number"
          inputMode="decimal"
          step="0.1"
          defaultValue={goal?.target_weight_kg}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="targetBodyFatPercent">
          目標体脂肪率 <span className="field-unit">(%・任意)</span>
        </label>
        <input
          id="targetBodyFatPercent"
          name="targetBodyFatPercent"
          type="number"
          inputMode="decimal"
          step="0.1"
          defaultValue={goal?.target_body_fat_percent ?? undefined}
        />
      </div>

      <div className="field">
        <label htmlFor="targetDate">
          目標日 <span className="field-unit">(任意)</span>
        </label>
        <input
          id="targetDate"
          name="targetDate"
          type="date"
          defaultValue={goal?.target_date ?? undefined}
        />
      </div>

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "保存中…" : "保存する"}
      </button>
    </form>
  );
}
