# Phase 2 セキュリティ実装メモ

Phase 1設計書へのフィードバック4点をどう実装に反映したかの記録です。

## 1. allowlistの識別子をuser_id(uuid)に

`allowed_users.user_id` を主キーとし、`auth.uid() = allowed_users.user_id` で認可判定します。`email` は管理・確認用の補助列（UNIQUE制約のみ）で、認可ロジックのどこにも使いません。メールアドレスを変更しても `user_id` は変わらないため、認可状態は影響を受けません。

## 2. 認可を多層化し、Middlewareを唯一の境界にしない

| 層 | 実装 | 役割 |
|---|---|---|
| Next.js Middleware | `src/lib/supabase/middleware.ts` | セッションの有無だけを見て未ログインを`/login`へ早期リダイレクト（UX目的）。allowlistは見ない |
| Server Action / Route Handler / Server Component | `src/lib/auth/require-allowed-user.ts` の `requireAllowedUser()` | セッション＋allowlist登録を独立に再確認。`(protected)/layout.tsx`と各ページの両方から呼び出し、Middlewareの実行有無に依存しない |
| Supabase RLS | `supabase/migrations/0001_init.sql` | 最終防御層。上位層が万一迂回されても、DBが`auth.uid() = user_id AND allowlist登録済み`以外の行を返さない |
| Storage RLS | 未使用（Phase 2時点で画像を保存する設計にしていないため） | Phase 4で画像の一時保存が必要になった場合に、privateバケット＋本人限定ポリシーとして追加する |
| AI処理 | 未実装（Phase 4以降） | プロンプト生成関数はセッションのuser_idからのみデータ取得する設計（Phase 1で確定済み） |

## 3. Service Role Keyの使用範囲

**Phase 2時点のアプリコードでは、Service Role Keyを一切使用していません。** 体組成・食事・生理データ・AIアドバイス用データの取得は、すべてログイン中ユーザーのセッション（`src/lib/supabase/server.ts`、anon key + Cookie）で行い、RLSの対象になります。

allowlistの登録・削除も、Service Role Keyを使うAPIコードを書くのではなく、管理者がSupabase SQL Editor（テーブル所有者権限で動作しRLSを自動的にバイパスする）から直接SQLを実行して管理します。アプリ本体からはallowlistを変更できません。

### 唯一の想定される例外（Phase 4/7/8で実装予定、Phase 2では未実装）

`daily_ai_advice` と `weekly_ai_reviews` への **INSERT/UPDATE** のみ、Service Role Keyを使うサーバー専用コードから行う設計とします。

- **どの処理で使うか**：AIが生成した日次アドバイス・週次レビューをDBへ保存する処理（Phase 4, 7, 8で実装）
- **なぜ必要か**：この2テーブルは「AIが生成した内容である」という真正性が重要です。通常ユーザーのINSERT/UPDATEを許可するRLSポリシーを書いてしまうと、ユーザー（またはAPIを直接叩いた第三者）が任意の文章を「AIアドバイス」として偽装保存できてしまいます。RLSは行の所有者は判定できても「内容がAI生成かどうか」までは判定できないため、書き込み経路をサーバー専用コードに絞ることで真正性を担保します
- **RLSを迂回しても安全な理由**：
  1. Service Role Keyはサーバー専用コード（Route Handler内）にのみ存在し、`NEXT_PUBLIC_`を付けずブラウザへ一切送信しない
  2. 書き込みを行う関数は、その処理の冒頭で必ず`requireAllowedUser()`相当の認可チェックを独自に行い、その結果得た`user.id`だけを`user_id`列に書き込む（クライアントから`user_id`を受け取って書き込むことはしない）
  3. SELECT（読み取り）にはこの例外を適用しない。読み取りは通常どおりユーザーセッション＋RLSで行う
  4. 現時点（Phase 2）ではこの経路のコード自体が存在しないため、リスクは発生していない。Phase 4/7/8で実装する際に、実際のコードで改めてこの設計をご確認いただく

`allowed_users`テーブルにもINSERT/UPDATE/DELETEポリシーを作成していません（管理者がSQL Editorから直接操作するため）。これもService Role Keyを使わずに済ませるための設計です。

## 4. Upstash Rate Limitの識別子とTTL

`src/lib/rate-limit.ts` の `checkRateLimit()` は、渡された識別子（Supabaseのuser_id、またはログイン試行時のメールアドレス）を**必ずSHA-256でハッシュ化してからUpstashへ送信**します。生のメールアドレスや体重・食事・生理などの個人データを直接キーにすることはありません。

TTL（有効期限）は `Ratelimit.slidingWindow()` が時間窓と同じ長さを自動的にRedisキーへ設定するため、時間窓が過ぎたデータはUpstash側で自動的に消え、長期保存されません。
