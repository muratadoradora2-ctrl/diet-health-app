"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { analyzeBodyCompositionImage, initialScanState } from "./actions";
import { BodyCompositionForm } from "../form";
import { jstDateString, jstTimeString } from "@/lib/date";

export function ScanFlow() {
  const [state, formAction, pending] = useActionState(
    analyzeBodyCompositionImage,
    initialScanState,
  );
  const [fileName, setFileName] = useState<string | null>(null);

  if (state.status === "success" && state.draft) {
    return (
      <BodyCompositionForm
        defaultDate={jstDateString()}
        defaultTime={jstTimeString()}
        defaultValues={state.draft}
        source="ai_scan"
        aiNotice
      />
    );
  }

  return (
    <form action={formAction} className="card">
      {state.status === "error" && <p className="error-text">{state.error}</p>}

      <div className="field">
        <label htmlFor="image">体組成計アプリのスクリーンショット</label>
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
        {pending ? "解析しています…" : "この画像を解析する"}
      </button>

      <p className="lead-note" style={{ marginTop: 12 }}>
        画像はAIによる数値の読み取りにのみ使用し、保存はされません。次の画面で内容を確認・修正してから登録します。
      </p>

      <Link href="/body-compositions/new/manual" className="button-secondary" style={{ marginTop: 16 }}>
        代わりに手入力する
      </Link>
    </form>
  );
}
