-- El código de atleta no puede ser consultable desde la API: si lo fuera,
-- cualquiera con la publishable key podría probar códigos y, al acertar, recibir
-- el user_id. La resolución vive dentro del trigger, que no es invocable por REST.

create or replace function public.coach_plans_resolve_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.athlete_codes where code = new.athlete_code;
  if owner_id is null then
    raise exception 'Código de atleta desconocido';
  end if;
  new.user_id := owner_id;
  new.updated_at := now();
  return new;
end $$;

revoke all on function public.coach_plans_resolve_owner() from public, anon, authenticated;

drop trigger if exists coach_plans_resolve_owner on public.coach_plans;
create trigger coach_plans_resolve_owner before insert or update on public.coach_plans
  for each row execute function public.coach_plans_resolve_owner();

-- El trigger BEFORE ya dejó user_id resuelto cuando se evalúa este WITH CHECK.
drop policy if exists coach_plans_publish on public.coach_plans;
create policy coach_plans_publish on public.coach_plans
  for insert to anon, authenticated
  with check (user_id is not null);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end $$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
