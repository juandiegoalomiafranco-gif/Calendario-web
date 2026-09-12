-- Esquema de la app de finanzas.
-- Cómo aplicarlo: panel de Supabase → SQL Editor → pegar todo → Run.
--
-- Cada tabla guarda user_id y tiene RLS activo, así que un usuario solo puede leer y
-- escribir sus propias filas, incluso si alguien tomara la publishable key del navegador.

-- ---------------------------------------------------------------- cuentas
create table if not exists public.accounts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (
    kind in ('efectivo', 'banco', 'nequi', 'daviplata', 'ahorro', 'inversion', 'tarjeta')
  ),
  initial_balance numeric(14, 2) not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_user_idx on public.accounts (user_id);

-- ------------------------------------------------------------ movimientos
create table if not exists public.transactions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  type text not null check (type in ('ingreso', 'gasto', 'transferencia')),
  -- Siempre positivo: el signo lo da `type`.
  amount numeric(14, 2) not null check (amount >= 0),
  date date not null,
  category text not null,
  note text,
  to_account_id uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Una transferencia necesita destino, y ese destino no puede ser la misma cuenta.
  constraint transfer_needs_destination check (
    (type = 'transferencia' and to_account_id is not null and to_account_id <> account_id)
    or (type <> 'transferencia' and to_account_id is null)
  )
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_account_idx on public.transactions (account_id);

-- ------------------------------------------------------------ presupuesto
create table if not exists public.budgets (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  monthly_limit numeric(14, 2) not null check (monthly_limit >= 0),
  updated_at timestamptz not null default now(),
  -- Un solo límite por categoría y por usuario.
  unique (user_id, category)
);

create index if not exists budgets_user_idx on public.budgets (user_id);

-- ------------------------------------------------------------------ metas
create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  target_date date,
  -- Si apunta a una cuenta, el avance se lee del saldo de esa cuenta.
  account_id uuid references public.accounts (id) on delete set null,
  saved_amount numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id);

-- -------------------------------------------------------------------- RLS
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;

-- Una política por tabla que cubre select/insert/update/delete: solo tus filas.
-- `using` filtra lo que puedes leer o modificar; `with check` valida lo que insertas.
drop policy if exists "accounts_own_rows" on public.accounts;
create policy "accounts_own_rows" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_own_rows" on public.transactions;
create policy "transactions_own_rows" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "budgets_own_rows" on public.budgets;
create policy "budgets_own_rows" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals_own_rows" on public.goals;
create policy "goals_own_rows" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------- tablas anteriores
-- La app ya no usa las tablas de entrenamiento. Descomenta cuando confirmes que no
-- necesitas nada de ese histórico: el borrado no se puede deshacer.
-- drop table if exists public.training_log;
-- drop table if exists public.settings;
