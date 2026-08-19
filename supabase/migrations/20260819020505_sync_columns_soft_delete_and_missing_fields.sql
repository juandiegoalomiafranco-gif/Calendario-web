-- Mi Vida — columnas que el cliente ya escribía pero no existían, más la
-- infraestructura de sincronización (updated_at autoritativo + borrado suave).

-- 1) Columnas que faltaban y hacían fallar todos los upserts -----------------
alter table public.tasks
  add column if not exists kind text not null default 'tarea',
  add column if not exists scope text not null default 'colegio',
  add column if not exists area text,
  add column if not exists importance smallint not null default 2;

alter table public.tasks drop column if exists due_at;
alter table public.tasks drop column if exists priority;

alter table public.calendar_events
  add column if not exists important boolean not null default false,
  add column if not exists "time" text,
  add column if not exists source text not null default 'propio';

alter table public.school_config
  add column if not exists setup jsonb,
  add column if not exists no_class_days jsonb not null default '[]'::jsonb;

alter table public.transactions
  add column if not exists source text not null default 'mia';

-- 2) updated_at + deleted_at en todas las colecciones ------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'training_log','class_notes','tasks','body_controls','strength_logs','exercises',
    'training_notes','nutrition_log','calendar_events','accounts','transactions',
    'transfers','finance_categories','events'
  ] loop
    execute format(
      'alter table public.%I
         add column if not exists updated_at timestamptz not null default now(),
         add column if not exists deleted_at timestamptz', t);
    execute format(
      'create index if not exists %I on public.%I (user_id, updated_at)',
      t || '_user_updated_idx', t);
  end loop;

  foreach t in array array['school_config','settings','body_goals'] loop
    execute format(
      'alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
  end loop;
end $$;

-- 3) updated_at lo pone el servidor: un solo reloj para resolver conflictos ---
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'training_log','class_notes','tasks','body_controls','strength_logs','exercises',
    'training_notes','nutrition_log','calendar_events','accounts','transactions',
    'transfers','finance_categories','events','school_config','settings','body_goals'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function public.touch_updated_at()',
      t || '_touch_updated_at', t);
  end loop;
end $$;
