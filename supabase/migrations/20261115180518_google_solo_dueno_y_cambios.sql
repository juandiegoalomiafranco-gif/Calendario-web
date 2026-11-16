-- MyLife — arreglos de la revisión de Google Calendar y Gmail.
--
-- Aditiva e idempotente, como la anterior. Solo toca lo que creó esa migración (el
-- trigger, las tablas de Google y la función del cron) y la restricción de
-- `gmail_procesados.decision`, que se cambia por otra que la contiene.

-- 1) Solo el dueño puede vincular Google ---------------------------------------------
/*
 * Cualquiera puede crearse una cuenta en la app (el login es por código), así que sin
 * esta lista un tercero podría iniciar el OAuth con su cuenta y mandarle el enlace al
 * dueño: el permiso de Google del dueño quedaría guardado bajo la cuenta del tercero. Y
 * con la app de Google publicada, cualquiera podría conectar su Gmail y gastar la clave
 * de Anthropic del dueño en los crons.
 *
 * Sin políticas de RLS: solo la service role la lee. El id del dueño se inserta fuera de
 * las migraciones, como los secretos de app_secrets: no debe quedar escrito en el repo.
 */
create table if not exists public.google_permitidos (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  agregado_en timestamptz not null default now()
);
alter table public.google_permitidos enable row level security;
revoke all on public.google_permitidos from anon, authenticated;

-- 2) Qué campos cambió la app ----------------------------------------------------------
-- Lo que hay que mandar en el próximo PATCH. Se acumula hasta que la subida sale bien,
-- y así un cambio de hora no reescribe la descripción (ni al revés).
alter table public.calendar_events
  add column if not exists google_cambios text[] not null default '{}';

/*
 * Antes se marcaba pendiente toda escritura de la app, y como la app sube la fila entera,
 * marcar la estrella o cambiar el tipo (cosas que solo existen en la app) reescribía el
 * evento completo en Google: la descripción en HTML quedaba en texto plano, una instancia
 * de una serie se separaba de ella. Ahora solo cuenta lo que de verdad se sube.
 *
 * Los bundles viejos de la app convierten `google`/`gmail` en `propio` al guardar; se
 * conserva el origen para que desconectar u ocultar el calendario los siga quitando.
 */
create or replace function public.calendar_events_marcar_google_pendiente()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cambios text[] := '{}';
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.source in ('google', 'gmail') and new.source = 'propio' then
    new.source := old.source;
  end if;

  if new.source not in ('propio', 'google', 'gmail') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.google_pendiente := true;
    return new;
  end if;

  if new.title is distinct from old.title then v_cambios := array_append(v_cambios, 'title'); end if;
  if new."date" is distinct from old."date" then v_cambios := array_append(v_cambios, 'date'); end if;
  if new."time" is distinct from old."time" then v_cambios := array_append(v_cambios, 'time'); end if;
  if new.hora_fin is distinct from old.hora_fin then v_cambios := array_append(v_cambios, 'hora_fin'); end if;
  if new.fecha_fin is distinct from old.fecha_fin then v_cambios := array_append(v_cambios, 'fecha_fin'); end if;
  if new.lugar is distinct from old.lugar then v_cambios := array_append(v_cambios, 'lugar'); end if;
  if new.notes is distinct from old.notes then v_cambios := array_append(v_cambios, 'notes'); end if;
  if new.deleted_at is distinct from old.deleted_at then v_cambios := array_append(v_cambios, 'deleted_at'); end if;
  if new.source is distinct from old.source then v_cambios := array_append(v_cambios, 'source'); end if;

  if cardinality(v_cambios) > 0 then
    new.google_pendiente := true;
    new.google_cambios := array(
      select distinct c from unnest(coalesce(old.google_cambios, '{}') || v_cambios) as c order by c
    );
  end if;
  return new;
end $$;

revoke all on function public.calendar_events_marcar_google_pendiente() from public, anon, authenticated;

-- 3) Gmail: un correo se procesa una vez y un hilo da un solo evento --------------------
-- `procesando` es la reserva que se toma antes de llamar a Claude: dos corridas a la vez
-- (el cron y «Sincronizar ahora») ya no revisan el mismo correo ni crean dos eventos.
alter table public.gmail_procesados add column if not exists thread_id text;

alter table public.gmail_procesados drop constraint if exists gmail_procesados_decision_check;
alter table public.gmail_procesados add constraint gmail_procesados_decision_check
  check (decision in ('evento', 'descartado', 'error', 'procesando'));

-- Un correo y su recordatorio suelen venir en el mismo hilo: el índice deja un solo
-- evento por hilo aunque los dos lleguen en corridas simultáneas.
create unique index if not exists gmail_procesados_un_evento_por_hilo
  on public.gmail_procesados (user_id, thread_id)
  where decision = 'evento' and thread_id is not null;

-- 4) Los crons solo despiertan a las funciones si hay alguien permitido ------------------
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

  if funcion = 'google-sync' and not exists (
    select 1 from public.google_conexion c join public.google_permitidos p using (user_id)
  ) then
    return;
  end if;
  if funcion = 'gmail-scan' and not exists (
    select 1 from public.google_conexion c join public.google_permitidos p using (user_id)
    where c.gmail_activo and 'https://www.googleapis.com/auth/gmail.readonly' = any (c.scopes)
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
