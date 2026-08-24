"use client";

import { useActionState } from "react";
import { deleteWaterIntakeAction, type WaterFormState } from "./water-actions";

const initialState: WaterFormState = {};

export function WaterDeleteButton({ id }: { id: string }) {
  const [, formAction, pending] = useActionState(deleteWaterIntakeAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="water-delete-btn" disabled={pending} aria-label="削除">
        ×
      </button>
    </form>
  );
}
