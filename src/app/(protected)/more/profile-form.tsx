"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = {};

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction}>
      {state.error && <p className="error-text">{state.error}</p>}
      {state.success && <p className="success-text">保存しました</p>}
      <div className="field">
        <label htmlFor="displayName">表示名</label>
        <input id="displayName" name="displayName" type="text" defaultValue={displayName} required />
      </div>
      <button className="button-secondary" type="submit" disabled={pending}>
        保存
      </button>
    </form>
  );
}
