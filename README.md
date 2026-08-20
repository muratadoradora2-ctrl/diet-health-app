# ふたり健康管理

夫婦2人だけが使う、ダイエット・体調管理のWebアプリ（PWA）。Next.js + TypeScript + Supabase + Vercel + Claude API。

新規会員登録機能はありません。利用は事前に許可された2アカウントのみ（allowlist方式）です。

## 設計ドキュメント

- [`docs/phase1-design.md`](./docs/phase1-design.md) — 要件・アーキテクチャ・DB/RLS設計・AI/画像処理設計・生理周期予測ロジック・セキュリティ設計・デザイン方針
- [`docs/phase2-security-notes.md`](./docs/phase2-security-notes.md) — 認証・allowlist・RLSの多層防御、Service Role Keyの使用方針、Rate Limitの識別子設計

## セットアップ（開発）

```bash
npm install
cp .env.local.example .env.local   # 値はSupabase/Upstashダッシュボードから取得して埋める
npm run dev
```

`http://localhost:3000` は未ログイン時 `/login` へリダイレクトされます。ログインには、事前にSupabase Authで作成し `allowed_users` に登録した2アカウントのいずれかを使用します。

## データベース

`supabase/migrations/0001_init.sql` に、テーブル定義とRow Level Securityポリシーをまとめています。Supabaseダッシュボードの SQL Editor で実行してください（手順はセットアップ時にご案内します）。

## セキュリティ設計の要点

- 認可はMiddleware・Server Action/Route Handler・Supabase RLSの3層で独立に確認（詳細は `docs/phase2-security-notes.md`）
- `allowed_users` はSupabaseのuser_id（uuid）を主キーとし、メールアドレスは補助情報
- Service Role Keyはアプリコードから未使用（Phase 2時点）。使用が必要になった場合は理由を明記してから追加する
- Rate Limit（Upstash）の識別子は常にハッシュ化してから送信し、個人データは送信・保存しない
