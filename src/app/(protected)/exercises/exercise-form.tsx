"use client";

import { useActionState, useState } from "react";
import { EXERCISE_TYPES, estimateCaloriesBurned } from "@/lib/exercise-met";

export type ExerciseFormState = { error?: string };

export type ExerciseInitialValues = {
  exerciseType: string;
  date: string;
  time: string;
  durationMinutes: number | null;
  caloriesKcal: number | null;
  memo: string | null;
};

export function ExerciseForm({
  action,
  exerciseId,
  submitLabel = "登録する",
  latestWeightKg,
  initialValues,
}: {
  action: (prevState: ExerciseFormState, formData: FormData) => Promise<ExerciseFormState>;
  exerciseId?: string;
  submitLabel?: string;
  latestWeightKg: number | null;
  initialValues: ExerciseInitialValues;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  const [exerciseType, setExerciseType] = useState(initialValues.exerciseType);
  const [duration, setDuration] = useState(initialValues.durationMinutes);
  const [calories, setCalories] = useState(initialValues.caloriesKcal);

  function handleEstimate() {
    if (latestWeightKg === null || !duration || duration <= 0) return;
    setCalories(estimateCaloriesBurned(exerciseType, latestWeightKg, duration));
  }

  return (
    <form action={formAction} className="card">
      {exerciseId && <input type="hidden" name="id" value={exerciseId} />}
      {state.error && <p className="error-text">{state.error}</p>}

      <div className="field">
        <label htmlFor="exerciseType">種目</label>
        <select
          id="exerciseType"
          name="exerciseType"
          value={exerciseType}
          onChange={(e) => setExerciseType(e.target.value)}
          required
        >
          {EXERCISE_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="performedDate">日付</label>
          <input
            id="performedDate"
            name="performedDate"
            type="date"
            defaultValue={initialValues.date}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="performedTime">時刻</label>
          <input
            id="performedTime"
            name="performedTime"
            type="time"
            defaultValue={initialValues.time}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="durationMinutes">
          時間 <span className="field-unit">(分)</span>
        </label>
        <input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          value={duration ?? ""}
          onChange={(e) => setDuration(e.target.value === "" ? null : Number(e.target.value))}
          required
        />
      </div>

      <button
        type="button"
        className="button-secondary"
        onClick={handleEstimate}
        disabled={latestWeightKg === null || !duration}
      >
        消費カロリーを目安で計算する
      </button>
      {latestWeightKg === null && (
        <p className="lead-note">
          体組成の記録がまだ無いため、自動計算はできません。手入力してください。
        </p>
      )}

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="caloriesKcal">
          消費カロリー <span className="field-unit">(kcal・任意)</span>
        </label>
        <input
          id="caloriesKcal"
          name="caloriesKcal"
          type="number"
          inputMode="numeric"
          step="1"
          value={calories ?? ""}
          onChange={(e) => setCalories(e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>
      <p className="lead-note">
        ※ 体重・時間・運動強度(METs)から機械的に算出した目安です。実際の消費量とは異なります。
      </p>

      <div className="field">
        <label htmlFor="memo">
          メモ <span className="field-unit">(任意)</span>
        </label>
        <textarea id="memo" name="memo" rows={2} defaultValue={initialValues.memo ?? undefined} />
      </div>

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "保存中…" : submitLabel}
      </button>
    </form>
  );
}
