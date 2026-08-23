"use client";

import { useActionState } from "react";
import { updateCycleAction, deleteCycleAction, type DeleteCycleState } from "./actions";
import { CycleForm } from "../cycle-form";
import type { MenstrualCycle } from "@/lib/types";

const initialState: DeleteCycleState = {};

export function EditCycleForm({ cycle }: { cycle: MenstrualCycle }) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCycleAction,
    initialState,
  );

  return (
    <>
      <CycleForm
        action={updateCycleAction}
        cycleId={cycle.id}
        submitLabel="保存する"
        initialValues={{
          startDate: cycle.start_date,
          endDate: cycle.end_date,
          memo: cycle.memo,
        }}
      />

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm("この記録を削除します。よろしいですか?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={cycle.id} />
        {deleteState.error && <p className="error-text">{deleteState.error}</p>}
        <button className="button-danger" type="submit" disabled={deletePending}>
          {deletePending ? "削除中…" : "この記録を削除する"}
        </button>
      </form>
    </>
  );
}
