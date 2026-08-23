"use client";

import { useActionState } from "react";
import { refreshDailyAdvice, type AdviceRefreshState } from "./actions";

const initialState: AdviceRefreshState = {};

export function AdviceRefreshButton() {
  const [state, formAction, pending] = useActionState(refreshDailyAdvice, initialState);

  return (
    <form action={formAction} className="advice-refresh-form">
      {state.error && <p className="error-text">{state.error}</p>}
      <button type="submit" className="advice-refresh-btn" disabled={pending}>
        {pending ? "更新中…" : "アドバイスを更新"}
      </button>
    </form>
  );
}
