"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { analyzeMealImage, type MealScanState } from "./actions";
import { MealEntryForm } from "../../meal-entry-form";
import { createMeal } from "../actions";
import type { MealTypeKey } from "../../meal-fields";
import { jstDateString, jstTimeString } from "@/lib/date";

const initialState: MealScanState = { status: "idle" };

export function PhotoFlow({ defaultType }: { defaultType: MealTypeKey }) {
  const [state, formAction, pending] = useActionState(analyzeMealImage, initialState);
  const [fileName, setFileName] = useState<string | null>(null);

  if (state.status === "success" && state.draft) {
    return (
      <MealEntryForm
        action={createMeal}
        aiNotice
        initialValues={{
          mealType: defaultType,
          date: jstDateString(),
          time: jstTimeString(),
          text: state.draft.description ?? "",
          caloriesKcal: state.draft.estimatedCaloriesKcal,
          proteinG: state.draft.estimatedProteinG,
          fatG: state.draft.estimatedFatG,
          carbsG: state.draft.estimatedCarbsG,
          isAiEstimated: true,
        }}
      />
    );
  }

  return (
    <form action={formAction} className="card">
      {state.status === "error" && <p className="error-text">{state.error}</p>}

      <div className="field">
        <label htmlFor="image">食事の写真</label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      {fileName && <p className="lead-note">選択中: {fileName}</p>}

      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "解析しています…" : "この写真を解析する"}
      </button>

      <p className="lead-note" style={{ marginTop: 12 }}>
        写真はAIによる推定にのみ使用し、保存はされません。次の画面で内容を確認・修正してから登録します。
      </p>

      <Link
        href={`/meals/new/text?type=${defaultType}`}
        className="button-secondary"
        style={{ marginTop: 16 }}
      >
        代わりにテキストで入力する
      </Link>
    </form>
  );
}
