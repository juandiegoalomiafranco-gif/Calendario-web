-- Notificaciones push (bloque J) --------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Puente con la app del entrenador (bloque I) --------------------------------
-- El código de atleta es una credencial de capacidad: largo y aleatorio. Quien lo
-- tenga puede PUBLICAR un plan, pero nadie puede LEER los planes salvo el dueño.
create table if not exists public.athlete_codes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code       text unique not null,
  created_at timestamptz not null default now()
);
alter table public.athlete_codes enable row level security;
drop policy if exists athlete_codes_own on public.athlete_codes;
create policy athlete_codes_own on public.athlete_codes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.coach_plans (
  id           uuid primary key default gen_random_uuid(),
  athlete_code text not null,
  user_id      uuid references auth.users(id) on delete cascade,
  coach_name   text,
  week_start   date,
  payload      jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
alter table public.coach_plans enable row level security;

drop policy if exists coach_plans_read_own on public.coach_plans;
create policy coach_plans_read_own on public.coach_plans
  for select to authenticated using (user_id = auth.uid());

drop policy if exists coach_plans_manage_own on public.coach_plans;
create policy coach_plans_manage_own on public.coach_plans
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists coach_plans_delete_own on public.coach_plans;
create policy coach_plans_delete_own on public.coach_plans
  for delete to authenticated using (user_id = auth.uid());

create index if not exists coach_plans_user_updated_idx on public.coach_plans (user_id, updated_at);

-- Realtime: sin esto el celular y el computador no se enteran el uno del otro --
do $$
declare t text;
begin
  foreach t in array array[
    'training_log','class_notes','tasks','body_controls','strength_logs','exercises',
    'training_notes','nutrition_log','calendar_events','accounts','transactions',
    'transfers','finance_categories','events','school_config','settings','body_goals',
    'coach_plans'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
