-- 追加機能: 今日の歩数・水分摂取量の記録
--
-- exercises/mealsとは異なり、どちらも「1日の合計値」という性質のため、
-- 個別のテーブルとして分ける。歩数は1日1値の上書き型(upsert)、
-- 水分は都度追加していく積み上げ型、という記録の性質の違いに合わせている。
-- どちらも通常のRLSのみで保護(Service Role Keyは使わない)。

create table public.daily_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  steps integer not null check (steps >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.daily_steps enable row level security;

create policy "select_own_daily_steps"
  on public.daily_steps for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_daily_steps"
  on public.daily_steps for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_daily_steps"
  on public.daily_steps for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_daily_steps"
  on public.daily_steps for delete
  using (auth.uid() = user_id and public.is_allowed_user());

create trigger set_daily_steps_updated_at
  before update on public.daily_steps
  for each row execute function public.set_updated_at();

create table public.water_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null,
  volume_ml integer not null check (volume_ml > 0),
  updated_at timestamptz not null default now()
);

create index water_intakes_user_logged_idx on public.water_intakes (user_id, logged_at desc);

alter table public.water_intakes enable row level security;

create policy "select_own_water_intakes"
  on public.water_intakes for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_water_intakes"
  on public.water_intakes for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_water_intakes"
  on public.water_intakes for delete
  using (auth.uid() = user_id and public.is_allowed_user());
