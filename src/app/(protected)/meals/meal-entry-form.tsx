"use client";

import { useActionState, useState, useTransition } from "react";
import { MEAL_TYPES, type MealTypeKey } from "./meal-fields";
import { estimateMealFromText } from "./estimate-actions";

export type MealEntryFormState = { error?: string };

export type MealEntryInitialValues = {
  mealType: MealTypeKey;
  date: string;
  time: string;
  text: string;
  caloriesKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  isAiEstimated: boolean;
};

export function MealEntryForm({
  action,
  mealId,
  initialValues,
  aiNotice = false,
  submitLabel = "登録する",
}: {
  action: (prevState: MealEntryFormState, formData: FormData) => Promise<MealEntryFormState>;
  mealId?: string;
  initialValues: MealEntryInitialValues;
  aiNotice?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<MealEntryFormState, FormData>(
    action,
    {},
  );

  const [text, setText] = useState(initialValues.text);
  const [calories, setCalories] = useState(initialValues.caloriesKcal);
  const [protein, setProtein] = useState(initialValues.proteinG);
  const [fat, setFat] = useState(initialValues.fatG);
  const [carbs, setCarbs] = useState(initialValues.carbsG);
  const [isAiEstimated, setIsAiEstimated] = useState(initialValues.isAiEstimated);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isEstimating, startEstimate] = useTransition();

  function handleEstimate() {
    setEstimateError(null);
    startEstimate(async () => {
      const result = await estimateMealFromText(text);
      if (!result.success) {
        setEstimateError(result.error);
        return;
      }
      if (result.draft.estimatedCaloriesKcal !== null) setCalories(result.draft.estimatedCaloriesKcal);
      if (result.draft.estimatedProteinG !== null) setProtein(result.draft.estimatedProteinG);
      if (result.draft.estimatedFatG !== null) setFat(result.draft.estimatedFatG);
      if (result.draft.estimatedCarbsG !== null) setCarbs(result.draft.estimatedCarbsG);
      setIsAiEstimated(true);
    });
  }

  return (
    <form action={formAction} className="card">
      {mealId && <input type="hidden" name="id" value={mealId} />}
      <input type="hidden" name="isAiEstimated" value={isAiEstimated ? "true" : "false"} />

      {aiNotice && (
        <div className="callout-ai">
          <p>AIが読み取った内容です。内容を確認し、必要に応じて修正してから登録してください。</p>
        </div>
      )}

      {state.error && <p className="error-text">{state.error}</p>}

      <div className="field">
        <label htmlFor="mealType">区分</label>
        <select id="mealType" name="mealType" defaultValue={initialValues.mealType} required>
          {MEAL_TYPES.map((mealType) => (
            <option key={mealType.key} value={mealType.key}>
              {mealType.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="eatenDate">日付</label>
          <input
            id="eatenDate"
            name="eatenDate"
            type="date"
            defaultValue={initialValues.date}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="eatenTime">時刻</label>
          <input
            id="eatenTime"
            name="eatenTime"
            type="time"
            defaultValue={initialValues.time}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="inputText">食べたもの</label>
        <textarea
          id="inputText"
          name="inputText"
          rows={4}
          placeholder="例:白米、納豆、目玉焼き2個、味噌汁"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>

      <button
        type="button"
        className="button-secondary"
        onClick={handleEstimate}
        disabled={isEstimating || !text.trim()}
      >
        {isEstimating ? "推定しています…" : "AIで栄養を推定する"}
      </button>
      {estimateError && <p className="error-text">{estimateError}</p>}

      <div className="field-row" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="caloriesKcal">
            カロリー <span className="field-unit">(kcal)</span>
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
        <div className="field">
          <label htmlFor="proteinG">
            たんぱく質 <span className="field-unit">(g)</span>
          </label>
          <input
            id="proteinG"
            name="proteinG"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={protein ?? ""}
            onChange={(e) => setProtein(e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="fatG">
            脂質 <span className="field-unit">(g)</span>
          </label>
          <input
            id="fatG"
            name="fatG"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={fat ?? ""}
            onChange={(e) => setFat(e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="carbsG">
            炭水化物 <span className="field-unit">(g)</span>
          </label>
          <input
            id="carbsG"
            name="carbsG"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={carbs ?? ""}
            onChange={(e) => setCarbs(e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
      </div>

      {isAiEstimated && (
        <p className="lead-note">栄養価はAI推定です。実際とは異なる場合があります。</p>
      )}

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "登録中…" : submitLabel}
      </button>
    </form>
  );
}
