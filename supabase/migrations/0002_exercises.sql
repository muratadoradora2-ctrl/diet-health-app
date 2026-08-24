-- 追加機能: 運動記録
--
-- mealsテーブルと同じ設計方針: 本人のみがアクセスできるRLSポリシー、
-- Service Role Keyは使わない自己管理型のデータ(AI生成物ではないため)。

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  performed_at timestamptz not null,
  exercise_type text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  estimated_calories_kcal integer,
  memo text,
  updated_at timestamptz not null default now()
);

create index exercises_user_performed_idx on public.exercises (user_id, performed_at desc);

alter table public.exercises enable row level security;

create policy "select_own_exercises"
  on public.exercises for select
  using (auth.uid() = user_id and public.is_allowed_user());

create policy "insert_own_exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "update_own_exercises"
  on public.exercises for update
  using (auth.uid() = user_id and public.is_allowed_user())
  with check (auth.uid() = user_id and public.is_allowed_user());

create policy "delete_own_exercises"
  on public.exercises for delete
  using (auth.uid() = user_id and public.is_allowed_user());

create trigger set_exercises_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();
