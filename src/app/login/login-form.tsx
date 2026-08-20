"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

const initialState: SignInState = {};

export default function LoginForm({
  notAllowedMessage,
}: {
  notAllowedMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const displayError = state.error ?? notAllowedMessage;

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 360 }}>
        <h1 style={{ fontSize: "1.3rem", marginBottom: 6 }}>ふたり健康管理</h1>
        <p
          style={{
            color: "var(--ink-soft)",
            fontSize: "0.9rem",
            marginBottom: 24,
          }}
        >
          許可されたアカウントでログインしてください。
        </p>

        <form action={formAction}>
          {displayError && <p className="error-text">{displayError}</p>}

          <div className="field">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>

          <button className="button-primary" type="submit" disabled={pending}>
            {pending ? "ログイン中…" : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}
