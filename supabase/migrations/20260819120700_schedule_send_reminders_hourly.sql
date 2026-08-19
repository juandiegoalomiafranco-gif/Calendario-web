create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

/*
 * Llama a la Edge Function cada hora en punto. La función mira qué usuarios pidieron
 * el aviso a esa hora (en hora de Colombia) y solo a esos les manda. Así la hora del
 * aviso es configurable desde la app sin tener que tocar el cron.
 *
 * El token viaja desde app_secrets, que solo lee la service role: la definición de la
 * tarea no guarda ninguna credencial escrita a mano.
 */
create or replace function public.disparar_recordatorios()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token text;
begin
  select value->>'token' into token from public.app_secrets where name = 'cron_token';
  if token is null then
    raise warning 'disparar_recordatorios: falta el cron_token en app_secrets';
    return;
  end if;

  perform net.http_post(
    url := 'https://laabrbjtxugddlxtryou.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', token),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end $$;

revoke all on function public.disparar_recordatorios() from public, anon, authenticated;

select cron.unschedule('send-reminders-hourly')
where exists (select 1 from cron.job where jobname = 'send-reminders-hourly');

select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$ select public.disparar_recordatorios() $$
);
