"use client";

import { useActionState } from "react";
import { createBodyComposition, type BodyCompositionFormState } from "../actions";
import type { BodyCompositionDraft } from "@/lib/ai/provider";

const initialState: BodyCompositionFormState = {};

function NumField({
  id,
  label,
  unit,
  step = "0.1",
  defaultValue,
}: {
  id: string;
  label: string;
  unit: string;
  step?: string;
  defaultValue?: number | null;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {unit && <span className="field-unit">({unit})</span>}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="decimal"
        step={step}
        defaultValue={defaultValue ?? undefined}
      />
    </div>
  );
}

export function BodyCompositionForm({
  defaultDate,
  defaultTime,
  defaultValues,
  source,
  aiNotice = false,
}: {
  defaultDate: string;
  defaultTime: string;
  defaultValues?: Partial<BodyCompositionDraft>;
  source: "manual" | "ai_scan";
  aiNotice?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createBodyComposition, initialState);
  const v = defaultValues ?? {};

  return (
    <form action={formAction} className="card">
      <input type="hidden" name="source" value={source} />

      {aiNotice && (
        <div className="callout-ai">
          <p>
            AIが画像から読み取った数値です。内容を確認し、必要に応じて修正してから登録してください。
          </p>
        </div>
      )}

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
        <input
          id="weightKg"
          name="weightKg"
          type="number"
          inputMode="decimal"
          step="0.1"
          defaultValue={v.weightKg ?? undefined}
          required
        />
      </div>

      <NumField id="bmi" label="BMI" unit="" defaultValue={v.bmi} />
      <NumField id="bodyFatPercent" label="体脂肪率" unit="%" defaultValue={v.bodyFatPercent} />
      <NumField
        id="skeletalMusclePercent"
        label="骨格筋率"
        unit="%"
        defaultValue={v.skeletalMusclePercent}
      />
      <NumField id="muscleMassKg" label="筋肉量" unit="kg" defaultValue={v.muscleMassKg} />
      <NumField id="proteinPercent" label="タンパク質率" unit="%" defaultValue={v.proteinPercent} />
      <NumField
        id="basalMetabolismKcal"
        label="基礎代謝量"
        unit="kcal"
        step="1"
        defaultValue={v.basalMetabolismKcal}
      />
      <NumField id="leanBodyMassKg" label="除脂肪体重" unit="kg" defaultValue={v.leanBodyMassKg} />
      <NumField
        id="subcutaneousFatPercent"
        label="皮下脂肪率"
        unit="%"
        defaultValue={v.subcutaneousFatPercent}
      />
      <NumField
        id="visceralFatLevel"
        label="内臓脂肪レベル"
        unit=""
        step="1"
        defaultValue={v.visceralFatLevel}
      />
      <NumField id="bodyWaterPercent" label="体水分率" unit="%" defaultValue={v.bodyWaterPercent} />
      <NumField id="boneMassKg" label="骨量" unit="kg" defaultValue={v.boneMassKg} />
      <NumField id="bodyAge" label="体内年齢" unit="歳" step="1" defaultValue={v.bodyAge} />

      <div className="field">
        <label htmlFor="bodyTypeLabel">
          体型判定 <span className="field-unit">(任意)</span>
        </label>
        <input
          id="bodyTypeLabel"
          name="bodyTypeLabel"
          type="text"
          placeholder="例:標準"
          defaultValue={v.bodyTypeLabel ?? undefined}
        />
      </div>

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "登録中…" : "登録する"}
      </button>
    </form>
  );
}
