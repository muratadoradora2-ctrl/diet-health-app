"use client";

import { useActionState } from "react";
import { updateDailyStepsAction, type StepsFormState } from "./steps-actions";

const initialState: StepsFormState = {};

export function StepsForm({ initialSteps }: { initialSteps: number | null }) {
  const [state, formAction, pending] = useActionState(updateDailyStepsAction, initialState);

  return (
    <form action={formAction} className="card">
      <h2 className="card-title">今日の歩数</h2>
      {state.error && <p className="error-text">{state.error}</p>}
      {state.success && <p className="success-text">保存しました</p>}
      <div className="field-row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="steps">
            歩数 <span className="field-unit">(歩)</span>
          </label>
          <input
            id="steps"
            name="steps"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            defaultValue={initialSteps ?? undefined}
            required
          />
        </div>
        <button
          className="button-secondary"
          type="submit"
          disabled={pending}
          style={{ alignSelf: "flex-end", marginBottom: 16 }}
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
