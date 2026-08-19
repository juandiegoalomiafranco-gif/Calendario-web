-- `rls_auto_enable` es un event trigger: llamarlo por REST fallaría igual, pero el
-- linter lo marca por estar expuesto en el esquema público. Se le quita el EXECUTE
-- a los roles de la API para dejar el informe limpio.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
