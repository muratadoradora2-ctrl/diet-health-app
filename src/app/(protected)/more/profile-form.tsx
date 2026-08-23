"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = {};

export function ProfileForm({
  displayName,
  menstrualTrackingEnabled,
}: {
  displayName: string;
  menstrualTrackingEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction}>
      {state.error && <p className="error-text">{state.error}</p>}
      {state.success && <p className="success-text">保存しました</p>}
      <div className="field">
        <label htmlFor="displayName">表示名</label>
        <input id="displayName" name="displayName" type="text" defaultValue={displayName} required />
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          name="menstrualTrackingEnabled"
          defaultChecked={menstrualTrackingEnabled}
        />
        生理周期を記録する(この端末の利用者本人のみに表示されます)
      </label>
      <button className="button-secondary" type="submit" disabled={pending}>
        保存
      </button>
    </form>
  );
}
