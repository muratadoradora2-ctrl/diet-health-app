-- Phase 2: 認証・allowlist・RLS・基本スキーマ
--
-- 設計方針（docs/phase1-design.md 参照）:
--   * 全テーブルで user_id を持ち、RLSで「本人の行だけ」に制御する
--   * 認可は「auth.uid() = user_id かつ allowlistに登録済み」の二重条件
--   * allowed_users は Supabase Auth の user_id (uuid) を主キーとし、
--     メールアドレスは補助情報として保持する（メール変更で認可が壊れない）
--   * daily_ai_advice / weekly_ai_reviews への書き込みは、AI生成物の
--     改ざん防止のため通常ユーザーのINSERT/UPDATEを許可しない
--     （Phase 4/7/8で、サーバー専用コードからService Role Keyを使って
--     書き込む設計とする。理由はdocs/phase2-security-notes.mdに記載）

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 共通: updated_at を自動更新するトリガー関数
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- allowed_users: アプリの利用を許可された2アカウントの名簿
-- 識別子は user_id (uuid) を主キーとする。email は補助情報。
-- ---------------------------------------------------------------------
create table public.allowed_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_label text,
  created_at timestamptz not null default now()
);

alter table public.allowed_users enable row level security;

-- 本人が「自分がallowlistに登録済みか」を確認できるだけの最小限のSELECT。
-- 他テーブルのRLSポリシーがEXISTSサブクエリでこのテーブルを参照する際も、
-- 呼び出し元ロールの権限としてこのポリシーが適用される。
create policy "select_own_allowlist_row"
  on public.allowed_users for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE/DELETEのポリシーは意図的に作成しない。
-- allowlistの追加・削除はSupabase SQL Editor（テーブル所有者権限、RLSを
-- 自動的にバイパスする）から管理者が直接行う。アプリ本体からは一切変更できない。

-- 他ポリシーで使う「本人がallowlistに登録済みか」の共通チェック関数
create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_users au
    where au.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- profiles: ユーザーごとの基本プロフィール
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  menstrual_tracking_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "select_own_profile"
  on public.profiles for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_profile"
  on public.profiles for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_profile"
  on public.profiles for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_profile"
  on public.profiles for delete
  using (auth.uid() = user_id and public.is_allowed_user());

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- user_settings: 通知・テーマなどの個人設定
-- ---------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  period_alert_days_before integer not null default 5
    check (period_alert_days_before in (3, 5, 7)),
  theme_preference text not null default 'system'
    check (theme_preference in ('system', 'light', 'dark')),
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "select_own_settings"
  on public.user_settings for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_settings"
  on public.user_settings for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create trigger set_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- goals: 目標体重・目標日の管理
-- ---------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  start_weight_kg numeric(5,2) not null check (start_weight_kg > 0),
  target_weight_kg numeric(5,2) not null check (target_weight_kg > 0),
  target_body_fat_percent numeric(4,1),
  target_date date,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create unique index goals_one_active_per_user
  on public.goals (user_id)
  where is_active;

create index goals_user_id_idx on public.goals (user_id);

alter table public.goals enable row level security;

create policy "select_own_goals"
  on public.goals for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_goals"
  on public.goals for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_goals"
  on public.goals for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_goals"
  on public.goals for delete
  using (auth.uid() = user_id and public.is_allowed_user());

create trigger set_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- body_compositions: 体組成の記録本体
-- 実際の体組成計アプリのスクリーンショットに合わせた列構成
-- ---------------------------------------------------------------------
create table public.body_compositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null,
  weight_kg numeric(5,2) not null check (weight_kg > 0),
  bmi numeric(4,1),
  body_fat_percent numeric(4,1),
  skeletal_muscle_percent numeric(4,1),
  muscle_mass_kg numeric(5,2),
  protein_percent numeric(4,1),
  basal_metabolism_kcal integer,
  lean_body_mass_kg numeric(5,2),
  subcutaneous_fat_percent numeric(4,1),
  visceral_fat_level numeric(4,1),
  body_water_percent numeric(4,1),
  bone_mass_kg numeric(4,2),
  body_type_label text,
  body_age integer,
  extra_metrics jsonb not null default '{}'::jsonb,
  source text not null check (source in ('ai_scan', 'manual')),
  created_at timestamptz not null default now()
);

create index body_compositions_user_measured_idx
  on public.body_compositions (user_id, measured_at desc);

alter table public.body_compositions enable row level security;

create policy "select_own_body_compositions"
  on public.body_compositions for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_body_compositions"
  on public.body_compositions for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_body_compositions"
  on public.body_compositions for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_body_compositions"
  on public.body_compositions for delete
  using (auth.uid() = user_id and public.is_allowed_user());

-- ---------------------------------------------------------------------
-- meals: 食事記録とAI推定栄養
-- ---------------------------------------------------------------------
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  input_text text,
  estimated_calories_kcal integer,
  estimated_protein_g numeric(5,1),
  estimated_fat_g numeric(5,1),
  estimated_carbs_g numeric(5,1),
  estimated_fiber_g numeric(5,1),
  is_ai_estimated boolean not null default true,
  user_adjusted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index meals_user_eaten_idx on public.meals (user_id, eaten_at desc);

alter table public.meals enable row level security;

create policy "select_own_meals"
  on public.meals for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_meals"
  on public.meals for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_meals"
  on public.meals for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_meals"
  on public.meals for delete
  using (auth.uid() = user_id and public.is_allowed_user());

create trigger set_meals_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- daily_ai_advice: 日次AIアドバイスのキャッシュ保存
-- INSERT/UPDATEポリシーは意図的に作成しない（Phase 4/7で、AI生成物の
-- 改ざん防止のためサーバー専用コード + Service Role Keyから書き込む）
-- ---------------------------------------------------------------------
create table public.daily_ai_advice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  advice_date date not null,
  content jsonb not null,
  input_data_hash text not null,
  model_used text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, advice_date)
);

alter table public.daily_ai_advice enable row level security;

create policy "select_own_daily_advice"
  on public.daily_ai_advice for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_daily_advice"
  on public.daily_ai_advice for delete
  using (auth.uid() = user_id and public.is_allowed_user());

-- ---------------------------------------------------------------------
-- weekly_ai_reviews: 週次レビューの履歴
-- INSERT/UPDATEポリシーは意図的に作成しない（daily_ai_adviceと同様）
-- ---------------------------------------------------------------------
create table public.weekly_ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  content jsonb not null,
  input_data_hash text not null,
  model_used text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

alter table public.weekly_ai_reviews enable row level security;

create policy "select_own_weekly_reviews"
  on public.weekly_ai_reviews for select
  using (auth.uid() = user_id and public.is_allowed_user());

-- ---------------------------------------------------------------------
-- menstrual_cycles: 生理周期。最も機密性の高いテーブル。
-- 本人以外（配偶者を含む）が一切アクセスできないことをPhase 11で
-- 重点的にテストする。
-- ---------------------------------------------------------------------
create table public.menstrual_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date check (end_date is null or end_date >= start_date),
  memo text,
  updated_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create index menstrual_cycles_user_start_idx
  on public.menstrual_cycles (user_id, start_date desc);

alter table public.menstrual_cycles enable row level security;

create policy "select_own_menstrual_cycles"
  on public.menstrual_cycles for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_menstrual_cycles"
  on public.menstrual_cycles for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_menstrual_cycles"
  on public.menstrual_cycles for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_menstrual_cycles"
  on public.menstrual_cycles for delete
  using (auth.uid() = user_id and public.is_allowed_user());

create trigger set_menstrual_cycles_updated_at
  before update on public.menstrual_cycles
  for each row execute function public.set_updated_at();
