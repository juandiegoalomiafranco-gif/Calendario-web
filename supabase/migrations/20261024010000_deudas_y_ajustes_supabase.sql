-- MyLife — deudas: lo que Juan Diego le debe a alguien («debo») y lo que alguien le
-- debe a él («me_deben»). Cuando se salda queda en el historial con su fecha y, si
-- la plata entró o salió de una cuenta, con el movimiento que se creó para eso.

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  direction text not null check (direction in ('debo', 'me_deben')),
  person text not null,
  amount numeric not null check (amount > 0),
  concept text,
  due_date date,
  -- Saldada: fecha en que se pagó. Nula mientras siga pendiente.
  paid_at date,
  -- Sin clave foránea a propósito: el cliente sube cada colección por separado y una
  -- cuenta creada sin señal podría llegar después que la deuda, y el upsert fallaría.
  paid_account_id uuid,
  paid_tx_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists debts_user_updated_idx on public.debts (user_id, updated_at);

alter table public.debts enable row level security;

drop policy if exists debts_own on public.debts;
create policy debts_own on public.debts
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Un solo reloj para resolver conflictos, igual que en las demás colecciones.
drop trigger if exists debts_touch_updated_at on public.debts;
create trigger debts_touch_updated_at before insert or update on public.debts
  for each row execute function public.touch_updated_at();

-- Para que el celular y el computador vean los cambios del otro sin recargar.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'debts'
  ) then
    alter publication supabase_realtime add table public.debts;
  end if;
end $$;

-- Índices que pedía el asesor de rendimiento: las claves foráneas a cuentas.
create index if not exists transactions_account_idx on public.transactions (account_id);
create index if not exists transfers_from_account_idx on public.transfers (from_account_id);
create index if not exists transfers_to_account_idx on public.transfers (to_account_id);

-- Mismas reglas, escritas con (select auth.uid()) para que Postgres lo evalúe una vez
-- por consulta y no una vez por fila.
alter policy push_own on public.push_subscriptions
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy athlete_codes_own on public.athlete_codes
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy coach_plans_read_own on public.coach_plans
  using (user_id = (select auth.uid()));
alter policy coach_plans_manage_own on public.coach_plans
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy coach_plans_delete_own on public.coach_plans
  using (user_id = (select auth.uid()));
