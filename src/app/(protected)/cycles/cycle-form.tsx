"use client";

import { useActionState } from "react";

export type CycleFormState = { error?: string };

export function CycleForm({
  action,
  cycleId,
  submitLabel,
  initialValues,
}: {
  action: (prevState: CycleFormState, formData: FormData) => Promise<CycleFormState>;
  cycleId?: string;
  submitLabel: string;
  initialValues?: {
    startDate?: string;
    endDate?: string | null;
    memo?: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="card">
      {state.error && <p className="error-text">{state.error}</p>}
      {cycleId && <input type="hidden" name="id" value={cycleId} />}

      <div className="field">
        <label htmlFor="startDate">開始日</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={initialValues?.startDate}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="endDate">
          終了日 <span className="field-unit">(任意)</span>
        </label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={initialValues?.endDate ?? undefined}
        />
      </div>

      <div className="field">
        <label htmlFor="memo">
          メモ <span className="field-unit">(任意)</span>
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={initialValues?.memo ?? undefined}
        />
      </div>

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "保存中…" : submitLabel}
      </button>
    </form>
  );
}
