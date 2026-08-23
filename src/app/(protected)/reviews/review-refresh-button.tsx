"use client";

import { useActionState } from "react";
import { refreshWeeklyReview, type ReviewRefreshState } from "./actions";

const initialState: ReviewRefreshState = {};

export function ReviewRefreshButton() {
  const [state, formAction, pending] = useActionState(refreshWeeklyReview, initialState);

  return (
    <form action={formAction} className="advice-refresh-form">
      {state.error && <p className="error-text">{state.error}</p>}
      <button type="submit" className="advice-refresh-btn" disabled={pending}>
        {pending ? "更新中…" : "レビューを更新"}
      </button>
    </form>
  );
}
