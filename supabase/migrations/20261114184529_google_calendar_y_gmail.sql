-- MyLife — Google Calendar (en los dos sentidos) y eventos sacados de Gmail.
--
-- Todo es aditivo e idempotente: correrla otra vez no rompe nada y no cambia ningún
-- dato guardado. La única excepción es la restricción de `type`, que se reemplaza por
-- otra más amplia (ver el punto 2).

-- 1) Columnas nuevas de calendar_events -------------------------------------------
alter table public.calendar_events
  add column if not exists fecha_fin date,
  add column if not exists hora_fin text,
  add column if not exists lugar text,
  add column if not exists google_event_id text,
  add column if not exists google_calendar_id text,
  add column if not exists google_etag text,
  add column if not exists google_link text,
  add column if not exists google_pendiente boolean not null default false,
  add column if not exists gmail_message_id text;

-- 2) Tipos de evento -----------------------------------------------------------------
-- La restricción vieja solo dejaba 'importante', 'colegio', 'entreno' y 'otro', pero la
-- app hace tiempo que usa 'personal', 'salud', 'viaje' y 'cumpleanos': esos eventos no
-- se podían guardar en la nube. Los que llegan de Google y de Gmail usan los mismos
-- tipos. Se cambia por una lista que contiene la anterior, así ninguna fila existente
-- deja de cumplirla.
alter table public.calendar_events drop constraint if exists calendar_events_type_check;
alter table public.calendar_events add constraint calendar_events_type_check
  check (type in ('personal', 'colegio', 'salud', 'viaje', 'cumpleanos', 'otro', 'importante', 'entreno'));

-- 3) Un evento de Google es una sola fila ------------------------------------------
-- Parcial: las filas que nunca pasaron por Google no tienen id y no deben chocar entre sí.
create unique index if not exists calendar_events_google_unico
  on public.calendar_events (user_id, google_calendar_id, google_event_id)
  where google_event_id is not null;

-- La subida busca solo las filas pendientes; casi nunca son más de unas pocas.
create index if not exists calendar_events_google_pendiente_idx
  on public.calendar_events (user_id)
  where google_pendiente;

-- 4) Qué hay que subir a Google ------------------------------------------------------
/*
 * Lo marca la base y no la app: así la app no tiene que mandar nada nuevo en su upsert
 * y no se puede olvidar. Solo cuentan las escrituras del rol `authenticated` (la app);
 * las de la service role (las Edge Functions que bajan de Google) no lo activan, y por
 * eso un cambio que viene de Google no rebota de vuelta a Google.
 *
 * No es SECURITY DEFINER a propósito: dentro de una función así `current_user` sería el
 * dueño de la función y nunca 'authenticated'.
 */
create or replace function public.calendar_events_marcar_google_pendiente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and new.source in ('propio', 'google', 'gmail') then
    new.google_pendiente := true;
  end if;
  return new;
end $$;

revoke all on function public.calendar_events_marcar_google_pendiente() from public, anon, authenticated;

drop trigger if exists calendar_events_google_pendiente on public.calendar_events;
create trigger calendar_events_google_pendiente
  before insert or update on public.calendar_events
  for each row execute function public.calendar_events_marcar_google_pendiente();

-- 5) Cuenta de Google vinculada ------------------------------------------------------
-- Lo que la app puede ver y tocar: la lista de calendarios (para elegir cuáles se ven)
-- y el interruptor de Gmail. Crearla y borrarla es cosa del servidor (OAuth).
create table if not exists public.google_conexion (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text,
  scopes        text[] not null default '{}',
  calendarios   jsonb not null default '[]'::jsonb,
  gmail_activo  boolean not null default true,
  ultima_sync   timestamptz,
  ultimo_gmail  timestamptz,
  ultimo_error  text,
  conectado_en  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.google_conexion enable row level security;

revoke all on public.google_conexion from anon;
revoke insert, delete, truncate, references, trigger on public.google_conexion from authenticated;

drop policy if exists google_conexion_ver on public.google_conexion;
create policy google_conexion_ver on public.google_conexion
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists google_conexion_cambiar on public.google_conexion;
create policy google_conexion_cambiar on public.google_conexion
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Un solo reloj, como en las demás tablas.
drop trigger if exists google_conexion_touch_updated_at on public.google_conexion;
create trigger google_conexion_touch_updated_at
  before insert or update on public.google_conexion
  for each row execute function public.touch_updated_at();

-- La tarjeta de Ajustes se actualiza sola cuando termina una sincronización.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'google_conexion'
  ) then
    alter publication supabase_realtime add table public.google_conexion;
  end if;
end $$;

-- 6) El refresh token de Google ------------------------------------------------------
/*
 * El token da acceso al calendario y al correo, así que no se guarda en claro en
 * ninguna tabla: va cifrado en Vault y aquí solo queda el id del secreto. Sin políticas
 * de RLS: solo la service role (las Edge Functions) llega a esta tabla.
 */
create table if not exists public.google_tokens (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  secreto_id     uuid not null,
  actualizado_en timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
revoke all on public.google_tokens from anon, authenticated;

/*
 * Las tres funciones son SECURITY DEFINER porque la service role no puede tocar el
 * esquema `vault` por su cuenta. Por lo mismo nadie más puede ejecutarlas: quien las
 * llamara podría leer el token de cualquier usuario.
 */
create or replace function public.google_guardar_token(p_user_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre text := 'google_refresh_token:' || p_user_id::text;
  v_id uuid;
begin
  if p_user_id is null or coalesce(p_token, '') = '' then
    raise exception 'google_guardar_token: faltan datos';
  end if;

  -- Por nombre y no por la tabla: si quedó un secreto huérfano, se reutiliza en vez de
  -- fallar por nombre repetido.
  select id into v_id from vault.secrets where name = v_nombre;
  if v_id is null then
    v_id := vault.create_secret(p_token, v_nombre, 'Refresh token de Google (MyLife)');
  else
    perform vault.update_secret(v_id, p_token);
  end if;

  insert into public.google_tokens (user_id, secreto_id, actualizado_en)
  values (p_user_id, v_id, now())
  on conflict (user_id) do update
    set secreto_id = excluded.secreto_id, actualizado_en = now();
end $$;

create or replace function public.google_leer_token(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select d.decrypted_secret
  from public.google_tokens t
  join vault.decrypted_secrets d on d.id = t.secreto_id
  where t.user_id = p_user_id
$$;

create or replace function public.google_borrar_token(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select secreto_id into v_id from public.google_tokens where user_id = p_user_id;
  delete from public.google_tokens where user_id = p_user_id;
  if v_id is not null then
    delete from vault.secrets where id = v_id;
  end if;
  delete from vault.secrets where name = 'google_refresh_token:' || p_user_id::text;
end $$;

revoke all on function public.google_guardar_token(uuid, text) from public, anon, authenticated;
revoke all on function public.google_leer_token(uuid) from public, anon, authenticated;
revoke all on function public.google_borrar_token(uuid) from public, anon, authenticated;
grant execute on function public.google_guardar_token(uuid, text) to service_role;
grant execute on function public.google_leer_token(uuid) to service_role;
grant execute on function public.google_borrar_token(uuid) to service_role;

-- 7) Estado del OAuth ------------------------------------------------------------------
-- Un nonce aleatorio por intento de conexión, de un solo uso y con caducidad: es lo que
-- impide que alguien fabrique la vuelta de Google con un `state` inventado.
create table if not exists public.google_oauth_estados (
  nonce    text primary key,
  user_id  uuid not null references auth.users(id) on delete cascade,
  volver_a text not null,
  expira   timestamptz not null default (now() + interval '10 minutes')
);
alter table public.google_oauth_estados enable row level security;
revoke all on public.google_oauth_estados from anon, authenticated;

-- 8) Correos ya revisados --------------------------------------------------------------
-- Sirve para no pagarle a Claude dos veces por el mismo correo y para que Ajustes
-- enseñe qué se decidió con cada uno (también los descartados, con su motivo).
create table if not exists public.gmail_procesados (
  user_id      uuid not null references auth.users(id) on delete cascade,
  message_id   text not null,
  procesado_en timestamptz not null default now(),
  decision     text not null check (decision in ('evento', 'descartado', 'error')),
  motivo       text,
  asunto       text,
  remitente    text,
  event_id     text,
  primary key (user_id, message_id)
);
alter table public.gmail_procesados enable row level security;

create index if not exists gmail_procesados_recientes_idx
  on public.gmail_procesados (user_id, procesado_en desc);

revoke all on public.gmail_procesados from anon;
revoke insert, update, delete, truncate, references, trigger on public.gmail_procesados from authenticated;

drop policy if exists gmail_procesados_ver on public.gmail_procesados;
create policy gmail_procesados_ver on public.gmail_procesados
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 9) Crons -----------------------------------------------------------------------------
/*
 * Mismo esquema que el de los recordatorios: el token del cron sale de app_secrets y la
 * definición de la tarea no guarda ninguna credencial. Si nadie tiene Google conectado
 * (o nadie tiene Gmail activo) ni siquiera se llama a la función: es gratis no hacerlo y
 * no gasta invocaciones del plan gratuito cada 5 minutos.
 */
create or replace function public.disparar_google(funcion text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token text;
begin
  if funcion not in ('google-sync', 'gmail-scan') then
    raise exception 'disparar_google: función desconocida %', funcion;
  end if;

  if funcion = 'google-sync' and not exists (select 1 from public.google_conexion) then
    return;
  end if;
  if funcion = 'gmail-scan' and not exists (
    select 1 from public.google_conexion
    where gmail_activo and 'https://www.googleapis.com/auth/gmail.readonly' = any (scopes)
  ) then
    return;
  end if;

  select value->>'token' into token from public.app_secrets where name = 'cron_token';
  if token is null then
    raise warning 'disparar_google: falta el cron_token en app_secrets';
    return;
  end if;

  perform net.http_post(
    url := 'https://laabrbjtxugddlxtryou.supabase.co/functions/v1/' || funcion,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', token),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
end $$;

revoke all on function public.disparar_google(text) from public, anon, authenticated;

select cron.unschedule('google-sync-5min')
where exists (select 1 from cron.job where jobname = 'google-sync-5min');

select cron.schedule(
  'google-sync-5min',
  '*/5 * * * *',
  $$ select public.disparar_google('google-sync') $$
);

-- A los :02 y :32 para no coincidir con google-sync (que cae en múltiplos de 5): las dos
-- suben eventos a Google y es mejor que no se pisen.
select cron.unschedule('gmail-scan-30min')
where exists (select 1 from cron.job where jobname = 'gmail-scan-30min');

select cron.schedule(
  'gmail-scan-30min',
  '2,32 * * * *',
  $$ select public.disparar_google('gmail-scan') $$
);
