"use client";

import { useState } from "react";

/**
 * サーバーでレンダリング済みのchildrenを、クライアント側の表示/非表示状態で
 * 切り替える。デフォルトは非表示(visible=false)。ページを開き直すたびに
 * 再び非表示に戻る(永続化はしない仕様)。
 */
export function ToggleReveal({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button type="button" className="reveal-toggle" onClick={() => setVisible(true)}>
        {label}を表示する
      </button>
    );
  }

  return (
    <div className="stack">
      {children}
      <button type="button" className="button-secondary" onClick={() => setVisible(false)}>
        {label}を隠す
      </button>
    </div>
  );
}
