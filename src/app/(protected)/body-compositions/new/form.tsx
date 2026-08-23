"use client";

import { useActionState } from "react";
import { createBodyComposition, type BodyCompositionFormState } from "../actions";

const initialState: BodyCompositionFormState = {};

function NumField({
  id,
  label,
  unit,
  step = "0.1",
}: {
  id: string;
  label: string;
  unit: string;
  step?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {unit && <span className="field-unit">({unit})</span>}
      </label>
      <input id={id} name={id} type="number" inputMode="decimal" step={step} />
    </div>
  );
}

export function BodyCompositionForm({
  defaultDate,
  defaultTime,
}: {
  defaultDate: string;
  defaultTime: string;
}) {
  const [state, formAction, pending] = useActionState(createBodyComposition, initialState);

  return (
    <form action={formAction} className="card">
      {state.error && <p className="error-text">{state.error}</p>}

      <div className="field-row">
        <div className="field">
          <label htmlFor="measuredDate">測定日</label>
          <input
            id="measuredDate"
            name="measuredDate"
            type="date"
            defaultValue={defaultDate}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="measuredTime">測定時刻</label>
          <input
            id="measuredTime"
            name="measuredTime"
            type="time"
            defaultValue={defaultTime}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="weightKg">
          体重 <span className="field-unit">(kg)・必須</span>
        </label>
        <input id="weightKg" name="weightKg" type="number" inputMode="decimal" step="0.1" required />
      </div>

      <NumField id="bmi" label="BMI" unit="" />
      <NumField id="bodyFatPercent" label="体脂肪率" unit="%" />
      <NumField id="skeletalMusclePercent" label="骨格筋率" unit="%" />
      <NumField id="muscleMassKg" label="筋肉量" unit="kg" />
      <NumField id="proteinPercent" label="タンパク質率" unit="%" />
      <NumField id="basalMetabolismKcal" label="基礎代謝量" unit="kcal" step="1" />
      <NumField id="leanBodyMassKg" label="除脂肪体重" unit="kg" />
      <NumField id="subcutaneousFatPercent" label="皮下脂肪率" unit="%" />
      <NumField id="visceralFatLevel" label="内臓脂肪レベル" unit="" step="1" />
      <NumField id="bodyWaterPercent" label="体水分率" unit="%" />
      <NumField id="boneMassKg" label="骨量" unit="kg" />
      <NumField id="bodyAge" label="体内年齢" unit="歳" step="1" />

      <div className="field">
        <label htmlFor="bodyTypeLabel">
          体型判定 <span className="field-unit">(任意)</span>
        </label>
        <input id="bodyTypeLabel" name="bodyTypeLabel" type="text" placeholder="例:標準" />
      </div>

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "登録中…" : "登録する"}
      </button>
    </form>
  );
}
