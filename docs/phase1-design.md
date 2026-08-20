# Phase 1 設計書 — ふたり健康管理（ダイエット・体調管理アプリ）

作成日: 2026-08-20
対象: 夫婦2名のみが利用するiPhone向けPWA（Next.js / TypeScript / Supabase / Vercel）

> 見やすいWeb版（カラーパレット・タイポグラフィ・ワイヤーフレーム付き）:
> https://claude.ai/code/artifact/ee09acd0-dffb-4b67-a1d8-5acc41a94c2c

このドキュメントはPhase 1（要件整理・設計）の成果物です。**コード実装はまだ行っていません。** 内容をご確認・ご承認いただいた後、Phase 2（Supabase構築・認証・allowlist・RLS）に進みます。

---

## 1. 要件整理

### コア機能
- 体組成の自動記録（スクリーンショットのAI解析）
- 目標管理（開始体重・目標体重・目標日）
- グラフ可視化（体重・体脂肪率・筋肉量、期間切替、7日移動平均）
- 食事記録（テキスト／写真入力、朝昼夕間食）
- AIによる栄養推定（カロリー・PFC）
- 日次AIアドバイス／週次AIレビュー
- 生理周期管理（開始日・終了日・メモ、次回予測、生理前アラート）
- 生理周期とグラフの重ね合わせ（ON/OFF切替）

### 非機能要件（最優先）
- プライバシー最優先。夫婦間でも生理周期・食事・体組成は共有しない
- allowlist方式。認証できてもアプリ利用を許可された2アカウントのみ
- 多層防御。画面で隠すのではなく、DB（RLS）・API・AI処理の各層で他人データへのアクセスを拒否
- 体組成・食事のスクリーンショットは解析後に破棄し、恒久保存しない
- 毎朝数十秒で完結する操作数の少ないUI

### 制約
- 一般公開しない。新規会員登録機能は作らない
- 利用者は本人と夫の2名のみ
- 主な利用端末はiPhone Safari（ホーム画面追加PWA）

---

## 2. 推奨アーキテクチャ

| 領域 | 採用技術 | 理由 |
|---|---|---|
| フロントエンド | Next.js（App Router）+ TypeScript | 画面とAPIを1プロジェクトで管理でき構成をシンプルに保てる |
| ホスティング | Vercel | Next.jsとの親和性が高く、サーバー専用環境変数でAPIキーを秘匿しやすい |
| 認証・DB・Storage | Supabase（Auth / PostgreSQL / Storage） | Row Level Securityが標準搭載され、DB層でのアクセス制御が組みやすい |
| 画像解析AI／助言生成AI | Claude API（Anthropic）に一本化（提案） | 画像を読めるモデルとテキスト生成モデルを同一ベンダーでまとめ、キー管理・請求・レート制御の窓口を1つにできる |
| PWA | Next.js + Web App Manifest + Service Worker（最小構成） | ホーム画面追加でアプリのように使える（Phase 10で対応） |

**全体構成:**

```
iPhone Safari (PWA)
      │
      ▼
Vercel (Next.js: 画面 + API Routes)
      │                       │
      ▼                       ▼
Supabase Auth           Supabase PostgreSQL (RLSで本人行のみ)
      │
      ▼
Claude API（画像解析・アドバイス生成、サーバー側からのみ呼び出し）
```

ブラウザはSupabaseやAI APIに直接アクセスしません。すべてVercel上のサーバー処理を経由させ、秘密鍵を露出させず「本人のデータだけ扱う」処理を一箇所に集約します。

---

## 3. 画面一覧・役割

| 画面 | 役割 |
|---|---|
| ログイン | Supabaseのメール+パスワードでログイン。新規登録フォームなし |
| ホーム | 今日の数値・目標進捗・AIアドバイス・生理アラートを一目で確認 |
| 体組成 | スクリーンショット登録、手入力、確認・修正、履歴一覧 |
| グラフ | 体重・体脂肪率・筋肉量の推移。期間切替、生理周期の重ね合わせ |
| 食事 | 朝昼夕間食を記録。テキスト／写真入力、AI推定栄養の確認・修正 |
| AIレビュー | 今日のアドバイス詳細、週次レビュー、過去レビューの履歴 |
| 生理 | カレンダーでの登録・編集・削除、次回予測、周期履歴（該当ユーザーのみ） |
| 設定 | プロフィール、目標編集、生理管理のON/OFF、アラート日数、テーマ |

生理周期を使わないアカウントでは、下部ナビ・設定から生理関連項目自体を非表示にします。

---

## 4. ユーザー操作フロー

**朝の基本フロー:** アプリを開く → 「今日の体組成を登録」 → スクショ選択 → 解析中 → 数値確認・修正 → 登録 → ホームでアドバイス更新

**食事記録フロー:** 食事画面 → 区分選択（朝/昼/夕/間食） → 「＋追加」 → テキスト or 写真 → AI推定確認 → 保存

**週次レビューフロー:** 毎週日曜深夜に自動生成（Cron） → 月曜朝ホームに表示 → タップで詳細

**生理登録フロー:** 生理画面 → カレンダーで開始日タップ → 終了日・メモ（任意） → 保存 → 次回予測を自動再計算

---

## 5. データベース設計

全テーブルに `user_id` を持たせ、RLSで「本人の行だけ」に制御します。体組成・食事の元画像を保存するテーブルはありません（7節参照）。

### allowed_users — 利用を許可された2アカウントの名簿
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| email | text | UNIQUE, NOT NULL | 許可するメールアドレス |
| user_id | uuid | FK → auth.users(id), NULLABLE | 初回ログイン後に紐づけ |
| display_label | text | NULLABLE | 管理用メモ（UIには非表示） |
| created_at | timestamptz | default now() | |

### profiles
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| user_id | uuid | PK, FK → auth.users(id) | |
| display_name | text | NOT NULL | |
| menstrual_tracking_enabled | boolean | default false | |
| created_at / updated_at | timestamptz | default now() | |

### body_compositions
共有いただいた実際のアプリ画面（体重／BMI／体脂肪率／骨格筋率／筋肉量／タンパク質率／基礎代謝量／除脂肪体重／皮下脂肪率／内臓脂肪レベル／体水分率／骨量／体型／体内年齢の14項目）に合わせて列を確定。今後さらに機種を変えても `extra_metrics`(jsonb) で項目を追加できます。

| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK, NOT NULL | |
| measured_at | timestamptz | NOT NULL | 測定日時 |
| weight_kg | numeric(5,2) | CHECK > 0 | 体重 |
| bmi | numeric(4,1) | NULLABLE | BMI |
| body_fat_percent | numeric(4,1) | NULLABLE | 体脂肪率 |
| skeletal_muscle_percent | numeric(4,1) | NULLABLE | 骨格筋率 |
| muscle_mass_kg | numeric(5,2) | NULLABLE | 筋肉量 |
| protein_percent | numeric(4,1) | NULLABLE | タンパク質率 |
| basal_metabolism_kcal | integer | NULLABLE | 基礎代謝量 |
| lean_body_mass_kg | numeric(5,2) | NULLABLE | 除脂肪体重 |
| subcutaneous_fat_percent | numeric(4,1) | NULLABLE | 皮下脂肪率 |
| visceral_fat_level | numeric(4,1) | NULLABLE | 内臓脂肪レベル |
| body_water_percent | numeric(4,1) | NULLABLE | 体水分率 |
| bone_mass_kg | numeric(4,2) | NULLABLE | 骨量 |
| body_type_label | text | NULLABLE | 体型判定（例：標準、重度の肥満） |
| body_age | integer | NULLABLE | 体内年齢 |
| extra_metrics | jsonb | default '{}' | 上記以外の機種固有項目の拡張余地 |
| source | text | CHECK IN ('ai_scan','manual') | |
| created_at | timestamptz | default now() | |

INDEX: `(user_id, measured_at desc)`

### goals
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK, NOT NULL | |
| start_date | date | NOT NULL | |
| start_weight_kg | numeric(5,2) | NOT NULL | |
| target_weight_kg | numeric(5,2) | NOT NULL | |
| target_body_fat_percent | numeric(4,1) | NULLABLE | |
| target_date | date | NULLABLE | |
| is_active | boolean | default true | |
| updated_at | timestamptz | default now() | |

部分UNIQUE: `(user_id) WHERE is_active`

### meals
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK, NOT NULL | |
| eaten_at | timestamptz | NOT NULL | |
| meal_type | text | CHECK IN ('breakfast','lunch','dinner','snack') | |
| input_text | text | NULLABLE | |
| estimated_calories_kcal | integer | NULLABLE | |
| estimated_protein_g | numeric(5,1) | NULLABLE | |
| estimated_fat_g | numeric(5,1) | NULLABLE | |
| estimated_carbs_g | numeric(5,1) | NULLABLE | |
| estimated_fiber_g | numeric(5,1) | NULLABLE | 将来項目 |
| is_ai_estimated | boolean | default true | |
| user_adjusted | boolean | default false | |
| updated_at | timestamptz | default now() | |

INDEX: `(user_id, eaten_at desc)`

### daily_ai_advice
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK, NOT NULL | |
| advice_date | date | NOT NULL | |
| content | jsonb | NOT NULL | |
| input_data_hash | text | NOT NULL | 再生成要否の判定用 |
| model_used | text | NOT NULL | |
| updated_at | timestamptz | default now() | |

UNIQUE: `(user_id, advice_date)`

### weekly_ai_reviews
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK, NOT NULL | |
| week_start_date / week_end_date | date | NOT NULL | |
| content | jsonb | NOT NULL | |
| input_data_hash | text | NOT NULL | |
| model_used | text | NOT NULL | |
| created_at | timestamptz | default now() | |

UNIQUE: `(user_id, week_start_date)`

### menstrual_cycles（最も機密性の高いテーブル）
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK, NOT NULL | |
| start_date | date | NOT NULL | |
| end_date | date | NULLABLE, CHECK ≥ start_date | |
| memo | text | NULLABLE | |
| updated_at | timestamptz | default now() | |

UNIQUE: `(user_id, start_date)`

### user_settings
| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| user_id | uuid | PK, FK | |
| period_alert_days_before | integer | default 5, CHECK IN (3,5,7) | |
| theme_preference | text | default 'system', CHECK IN ('system','light','dark') | |
| notifications_enabled | boolean | default true | |
| updated_at | timestamptz | default now() | |

---

## 6. RLS（Row Level Security）設計

すべてのテーブルでRLSを有効化し、「`auth.uid()` が行の `user_id` と一致し、かつ `allowed_users` に登録済み」の二重条件で統一します。

```sql
alter table body_compositions enable row level security;

create policy "select_own_and_allowed"
  on body_compositions for select
  using (
    auth.uid() = user_id
    and exists (select 1 from allowed_users au where au.user_id = auth.uid())
  );

create policy "insert_own_and_allowed"
  on body_compositions for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from allowed_users au where au.user_id = auth.uid())
  );

create policy "update_own_and_allowed"
  on body_compositions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete_own_and_allowed"
  on body_compositions for delete
  using (auth.uid() = user_id);
```

同じ4パターンを `goals` `meals` `daily_ai_advice` `weekly_ai_reviews` `menstrual_cycles` `user_settings` `profiles` すべてに適用します。`daily_ai_advice` / `weekly_ai_reviews` へのINSERT/UPDATEはサーバー（Service Role）経由のみとし、ユーザーからの直接書き込みは許可しません。`allowed_users` はクライアントから直接参照させません。

---

## 7. 画像処理フロー

方針: **画像はサーバーのメモリ上だけで処理し、ディスク・DB・Storageに書き込みません。** 数値化が終わった時点で画像データは即座に破棄します。

```
① スクショ選択 → ② サーバーAPIへアップロード → ③ MIME/サイズ検証
→ ④ メモリ上でAI Vision解析 → ⑤ 画像を即破棄
→ ⑥ 抽出結果を確認画面に表示 → ⑦ ユーザーが確認・修正
→ ⑧「登録」 → ⑨ 数値のみDB保存
```

やむを得ずStorageを使う場合は、`private`バケットに `{user_id}/{uuid}.jpg` の形で一時保存し、Storage RLSで本人のみアクセス可とします。解析完了後にアプリ側で即削除し、さらにSupabase Edge Functions + Cronで「一定時間以上前の一時画像」を定期削除する二重の安全網を用意します。食事写真も同様に、栄養推定後は保存しません。

**削除確認テスト（Phase 11）:** 解析後にサーバー側へ画像が残っていないことの自動テスト、Storage利用時はオブジェクトが存在しないことの確認、クリーンアップCronが実際に削除することの確認。

---

## 8. AI処理フロー

AI呼び出しはすべてサーバー側のAPI Routeから行い、ブラウザはAPIキーに一切触れません。渡すデータはログイン中の本人分のみに絞ります。

**日次アドバイスの生成条件:** 体組成登録・食事の追加/修正・「アドバイスを更新」操作のいずれかで生成を試みます。無駄なAI呼び出しを避けるため、その日の入力データ（体組成・食事・目標・生理周期など）からハッシュ値を計算し、`daily_ai_advice.input_data_hash` と比較。変化がなければAIを呼ばず保存済みの結果を表示、変化があれば再生成します。

**週次レビュー:** Vercel Cron（毎週日曜深夜など）で自動生成。前週・直近30日・ダイエット開始時とも比較します。手動再生成も同様にハッシュで重複を防ぎます。

**ユーザー間分離の担保:** プロンプト組み立て関数は必ず「現在ログイン中のセッションのuser_id」で取得したデータのみを使用し、他ユーザーのuser_idを直接渡せる関数シグネチャにしません。Phase 11でユーザーAのプロンプトにユーザーBのデータが混入しないことをテストします。

**安全なアドバイスの方針:** 極端な低カロリー・欠食・過度な糖質脂質制限・過度な運動・急激な減量を勧めない。単日でなく7日平均・数週間の傾向・体脂肪・筋肉量・食事・生理周期を総合評価。生理由来の体重変化は「可能性があります」等、断定を避ける。医療行為の代替助言をしない。「AIによるアドバイスです」と毎回明示。

**ログ方針:** プロンプト・レスポンス全文は永続ログに残さない。成功/失敗・所要時間・モデル名程度のみ記録し、実データ（体重・食事内容・生理周期）はログに出力しない。

---

## 9. 生理周期予測ロジック

1. 過去の生理開始日を新しい順に最大6周期分取得
2. 連続する開始日の差から周期日数のリストを作成
3. 平均周期日数 = リストの平均
4. ばらつき = 標準偏差
5. 現在の周期日数 = 今日 − 直近の開始日 + 1
6. 次回予定日 = 直近の開始日 + 平均周期日数
7. 予測範囲 = 次回予定日 ± ばらつき（最低±2日を確保）

記録が2周期未満は「データ不足のため予測できません」、3周期未満は「参考程度の予測です」と明示。ばらつきが小さければ「9月14日ごろ」、大きければ「予測範囲：9月12日〜17日」のように幅を持たせ、医療的な確定表現は使いません。

**生理前アラート:** 設定日数（初期値5日、3/5/7日から選択）以内に次回予定日が入ったらホームに控えめに表示。実際の開始日が登録された時点でその周期分のアラートは終了します。

---

## 10. セキュリティ設計

**認証・認可の3層:**
1. Supabase Authでログイン確認
2. `allowed_users` にメールが存在するか（Next.jsミドルウェア／サーバー側で毎リクエスト確認）
3. RLSで行レベルの本人確認（DB側が独立して再確認する最後の砦）

新規登録フォームは作らず、Supabase側で2アカウントを事前に手動発行します。

| 項目 | 対策 |
|---|---|
| 秘密鍵の管理 | Service Role Key・AI APIキーはサーバー専用環境変数。`NEXT_PUBLIC_`接頭辞は付けない |
| 入力値検証 | 全API入力をzod等でスキーマ検証 |
| アップロード検証 | ファイル内容からMIME種別を判定、最大サイズ制限 |
| Rate Limit | ユーザーごとのAPIリクエスト回数上限（特にAI呼び出し） |
| CSRF対策 | Same-Site Cookie運用とNext.jsサーバーアクションの標準保護 |
| XSS対策 | Reactの自動エスケープに任せ、dangerouslySetInnerHTMLは不使用 |
| SQLインジェクション | Supabaseクライアントのパラメータバインド＋RLS |
| セッション管理 | Supabase Auth標準セッション（httpOnly Cookie） |
| ログの個人情報保護 | 体重・食事内容・生理日などをエラーログ・Analyticsに出力しない |

**最重要事項:** 「画面上で見えない」ことはセキュリティとして扱いません。DB（RLS）・Storage（Storage RLS）・API（サーバー側本人確認）・AI処理（本人データのみ送信）の4層すべてで、本人以外のアクセスを独立して拒否できる状態を目指します。Phase 11で本番公開前に、他ユーザーのuser_idを直接指定した不正アクセス試行のテストを行います。

---

## 11. デザイン提案

Web版（カラーパレット・タイポグラフィ・ワイヤーフレームの視覚的な確認）は冒頭のリンクをご覧ください。要点のみ記載します。

- **コンセプト:** 「頑張らされている」のではなく「気軽に確認できる生活ツール」。清潔感・落ち着き・上品さ。医療アプリの堅さともダイエットアプリの派手さとも距離を置く
- **カラー:** ベースはアイボリー寄りのオフホワイト（#F6F4EF）とグレージュ（#EFEBE1）。アクセントはセージグリーン（#6C8060）を主役に、ブルー（#57748A）とテラコッタ（#B97A56）を補助的に使用。状態表現は色だけに頼らず文字・アイコンを併記
- **タイポグラフィ:** 見出しに明朝体「Zen Old Mincho」、本文・数値に「Zen Kaku Gothic New」。体重などの主要数値は大きく、単位は小さく表示。小数点以下は項目ごとに桁数統一（体重・体脂肪率・筋肉量は小数1桁）
- **主要コンポーネント:** 数値カード、進捗バー（開始→現在→目標、否定語を使わない）、アドバイスカード（要点1〜3個＋もっと見る）、期間切替タブ、生理アラートバナー、解析中インジケーター
- **下部ナビゲーション:** ホーム／記録／食事／グラフ／その他の5項目。生理管理・AIレビュー・設定は「その他」から。生理機能OFFのアカウントでは生理関連UIを非表示
- **体重増減の見せ方:** 前日比を強調しすぎず7日平均・傾向コメントを主役に。増加=赤／減少=緑という単純な色分けはしない

---

## 12. 実装前に決めていただきたいこと

1. **AI APIの選定** — Claude API（Anthropic）に一本化を推奨（画像解析・アドバイス生成を同一ベンダーで管理）
2. **体組成計の実物スクリーンショット** — 1〜2枚共有いただけると読み取り指示の精度を上げられます
3. **2アカウントの発行方法** — Supabaseダッシュボードから管理者が直接登録・招待を推奨
4. **夫アカウントでの生理機能** — 初期値OFF、関連UIを完全非表示でよいか
5. **公開ドメイン** — 当面は `*.vercel.app` を推奨
6. **Rate Limit基盤** — Upstash Redis（無料枠）の利用を推奨、外部サービス登録の可否をご確認ください
7. **アプリ名・アイコン** — 本書では仮称「ふたり健康管理」を使用。正式名称・アイコンの希望があれば教えてください

---

## 14. 最終確定仕様（Phase 2移行前 確認用）

12節の要判断事項へのご回答をすべて反映した最終仕様です。

**AI API — Claude一本化 + 疎結合設計:** 体組成解析・食事解析・日次アドバイス・週次レビューのすべてをClaude APIで実装。将来の差し替えに備え、AI呼び出しは共通インターフェース（`AIProvider`）越しにのみ行い、Claude固有の実装（プロンプト・APIクライアント）は`ClaudeProvider`の中に閉じ込めます。呼び出し側は`AIProvider`型だけを参照し、差し替え時はインスタンス生成箇所（ファクトリ関数1箇所）のみ変更すればよい設計とします。具体的なモデル名はPhase 4実装時に確定し、環境変数で切替可能にします。

**体組成スクリーンショット項目 — 確定:** 共有いただいたスクリーンショットの14項目をそのまま`body_compositions`の列として確定（5節参照）。

**2アカウントの発行方法 — 確定:**
1. Supabase Authダッシュボードから管理者が「本人」「夫」のメールアドレス＋パスワードで2アカウントを直接作成（新規登録フォームは作らない）
2. 同じ2件のメールアドレスを`allowed_users`テーブルに事前登録
3. ログイン方式はメールアドレス＋パスワード認証

**夫アカウントの生理データ — 完全分離の確定設計:**
- **DB／RLS**：`menstrual_cycles`は「auth.uid() = user_id」のみで行を返すため、夫のセッションが妻の行を問い合わせても結果は0件。空データベースと見分けがつかない
- **API**：生理関連のAPI Routeは他ユーザーのuser_idを受け取れる設計にしない（常にセッションのuser_idのみ使用）。夫のアカウントではUI・ルーティング自体からこれらの画面を除外する
- **AI処理**：`profiles.menstrual_tracking_enabled = false`のユーザーには、日次／週次アドバイス生成時に`menstrual_cycles`への問い合わせ自体を行わない（存在の推測材料となるレスポンス差異を作らない）
- **ログ／エラー**：生理関連の値はエラーログ・監視ツールに一切出力しない

**Rate Limit — Upstash Redis事前確認:**
| 確認項目 | 内容 |
|---|---|
| 何に使うか | AI呼び出しを伴うAPI（画像解析・食事解析・アドバイス生成）等への、ユーザーごとのリクエスト回数制限 |
| 無料枠での運用可否 | 2名のみの利用で1日の操作は多くても数十件程度のため無料枠で十分運用可能。Phase 2のアカウント作成時に実際の条件を確認 |
| 送信・保存するデータ | 「識別子（ユーザーのuuid＋API名）」と「アクセス回数・タイムスタンプ」のみ |
| 個人情報の非保存 | 体重・体脂肪率・食事内容・生理日など実データは一切送信しない。リクエスト本文もUpstashには渡さない |

**公開ドメイン・アプリ名 — 確定:** 当面は`*.vercel.app`を使用し、独自ドメインは完成後に検討。アプリ名・アイコンはコードにハードコードせず、Manifest／設定用の定数ファイル1箇所にまとめてロジックから分離します。

### 最終仕様サマリー

| 項目 | 最終仕様 |
|---|---|
| 認証 | Supabase Auth（メール＋パスワード）。管理者が2アカウントを手動発行。新規登録フォームなし |
| allowlist | `allowed_users`に2件のメールアドレスのみ登録。ミドルウェアで毎リクエスト確認 |
| RLS | 全テーブルで有効化。「auth.uid() = user_id かつ allowlist登録済み」の二重条件（SELECT/INSERT/UPDATE/DELETE） |
| 夫婦間のデータ分離 | 体組成・目標・食事・AIアドバイス・週次レビュー・設定はすべてuser_idでRLS分離。相手の行は一切取得不可 |
| 生理データの完全分離 | DB（RLS）・API（他user_id受け取り不可）・AI（フラグOFF時は問い合わせ自体をしない）・ログの4層で遮断。存在の推測も防止 |
| AIへのデータ送信範囲 | ログイン中の本人のデータのみ。プロンプト生成関数はセッションのuser_idからのみデータ取得。プロンプト・レスポンス全文は永続ログに残さない |
| Rate Limit | Upstash Redis。識別子＋回数のみ送信、個人データ（体重・食事・生理等）は送信・保存しない |

---

## 13. 承認後の流れ

この設計書のご確認・12節への回答をいただき次第、Phase 2（Supabase構築・認証・allowlist・RLS・基本セキュリティ）に進みます。Supabase・Vercel等でご自身に操作いただく箇所は、画面のどこを開き何をクリックするかまで一つずつご案内します。各Phase終了時には必ず一度立ち止まり、実装内容・DB変更・確認いただきたい点をご報告してから次のPhaseに進みます。
