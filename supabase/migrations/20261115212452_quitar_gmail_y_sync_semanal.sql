-- MyLife — se retira lo de Gmail y Google Calendar pasa a sincronizarse una vez por semana.
--
-- El dueño pidió quitar la lectura de correos y que el calendario se sincronice solo los
-- lunes por la mañana (por si lo citan a una reunión). Lo de Gmail no deja rastro: se
-- quitan su cron, su tabla y sus columnas. Antes de borrar nada se comprueba que no haya
-- datos de Gmail guardados; si los hubiera, la migración se detiene entera.

-- 1) Nada de Gmail que perder ----------------------------------------------------------
do $$
declare
  v_procesados bigint;
  v_eventos bigint;
begin
  select count(*) into v_procesados from public.gmail_procesados;
  select count(*) into v_eventos from public.calendar_events
  where source = 'gmail' or gmail_message_id is not null;
  if v_procesados > 0 or v_eventos > 0 then
    raise exception 'Quedan datos de Gmail (% correos revisados, % eventos): no se borra nada',
      v_procesados, v_eventos;
  end if;
end $$;

-- 2) Crons: fuera Gmail y fuera la sincronización cada 5 minutos ------------------------
select cron.unschedule('gmail-scan-30min')
where exists (select 1 from cron.job where jobname = 'gmail-scan-30min');

select cron.unschedule('google-sync-5min')
where exists (select 1 from cron.job where jobname = 'google-sync-5min');

/*
 * Solo existe google-sync. Mismo esquema que antes: el token del cron sale de app_secrets
 * y la definición de la tarea no guarda ninguna credencial; si nadie permitido tiene
 * Google conectado ni siquiera se llama a la función.
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
  if funcion is distinct from 'google-sync' then
    raise exception 'disparar_google: función desconocida %', funcion;
  end if;

  if not exists (
    select 1 from public.google_conexion c join public.google_permitidos p using (user_id)
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

-- pg_cron corre en UTC: las 11:00 UTC del lunes son las 6:00 en Bogotá (sin horario de
-- verano). Lo que se cambie en la app entre semana espera hasta aquí, salvo que se toque
-- «Sincronizar ahora» en Ajustes.
select cron.unschedule('google-sync-lunes')
where exists (select 1 from cron.job where jobname = 'google-sync-lunes');

select cron.schedule(
  'google-sync-lunes',
  '0 11 * * 1',
  $$ select public.disparar_google('google-sync') $$
);

-- 3) Qué hay que subir a Google, ya sin Gmail ------------------------------------------
/*
 * Igual que la versión anterior, pero las únicas fuentes que suben son `propio` y
 * `google`. Se conserva la guarda: los bundles viejos de la app convierten `google` en
 * `propio` al guardar, y sin ella desconectar u ocultar el calendario dejaría de quitar
 * esos eventos.
 *
 * No es SECURITY DEFINER a propósito: dentro de una función así `current_user` sería el
 * dueño de la función y nunca 'authenticated'.
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

  if tg_op = 'UPDATE' and old.source = 'google' and new.source = 'propio' then
    new.source := old.source;
  end if;

  if new.source not in ('propio', 'google') then
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

-- 4) Tabla y columnas de Gmail ---------------------------------------------------------
-- Se van con sus índices y su política. La app vieja lee estas tablas con select('*'),
-- así que quitar columnas no rompe sus lecturas.
drop table if exists public.gmail_procesados;

alter table public.calendar_events drop column if exists gmail_message_id;

alter table public.google_conexion
  drop column if exists gmail_activo,
  drop column if exists ultimo_gmail;
