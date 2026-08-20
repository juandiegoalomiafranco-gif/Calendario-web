-- Hora del aviso y su interruptor, sincronizados como el resto de ajustes.
alter table public.settings
  add column if not exists reminder_hour smallint not null default 19,
  add column if not exists reminders_on boolean not null default false;

-- La columna `importance` de tasks quedó sin usar: el grado de importancia lo lleva
-- `urgency`, que ya tenía tres niveles y sus colores. Fuera, para no dejar cruft.
alter table public.tasks drop column if exists importance;

/*
 * Secretos del servidor.
 *
 * La clave privada VAPID tiene que llegar a la Edge Function. Vive en esta tabla,
 * que tiene RLS activo y CERO políticas: ni `anon` ni `authenticated` pueden leerla
 * ni escribirla por la API. Solo la service role key —que Supabase le inyecta a la
 * Edge Function y nunca sale al navegador— salta RLS y puede leerla.
 *
 * Los valores (claves VAPID y token del cron) se insertan fuera de migraciones, a
 * propósito: no deben quedar escritos en el repositorio.
 */
create table if not exists public.app_secrets (
  name       text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_secrets enable row level security;

revoke all on public.app_secrets from anon, authenticated;
