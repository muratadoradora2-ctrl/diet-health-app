"use client";

import { useActionState } from "react";
import { addWaterIntakeAction, type WaterFormState } from "./water-actions";

const initialState: WaterFormState = {};
const PRESETS = [200, 350, 500];

export function WaterQuickAdd() {
  const [presetState, presetAction, presetPending] = useActionState(
    addWaterIntakeAction,
    initialState,
  );
  const [customState, customAction, customPending] = useActionState(
    addWaterIntakeAction,
    initialState,
  );

  return (
    <div className="stack">
      {presetState.error && <p className="error-text">{presetState.error}</p>}
      {customState.error && <p className="error-text">{customState.error}</p>}

      <form action={presetAction} className="water-preset-row">
        {PRESETS.map((ml) => (
          <button
            key={ml}
            type="submit"
            name="volumeMl"
            value={ml}
            className="button-secondary"
            disabled={presetPending}
          >
            +{ml}ml
          </button>
        ))}
      </form>

      <form action={customAction} className="field-row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
          <label htmlFor="customVolumeMl">
            自由入力 <span className="field-unit">(ml)</span>
          </label>
          <input
            id="customVolumeMl"
            name="volumeMl"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
          />
        </div>
        <button type="submit" className="button-secondary" disabled={customPending}>
          追加
        </button>
      </form>
    </div>
  );
}
