# Mi Calendario de Entrenamiento

App personal (Vite + React + TypeScript + Tailwind) con el calendario de entrenamiento: running,
natación y funcional organizados por esfuerzo, no por velocidad, y con el plan construido alrededor
de la meta que tengas puesta en ese momento.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Para probar cómo se ve el plan en otra fecha (solo en desarrollo): `http://localhost:5173/#/?fecha=2026-11-14`.

## Build de producción

```bash
npm run build
npm run preview
```

## Pruebas y lint

```bash
npm test    # motor de plan, festivos y fechas
npm run lint
```

## Instalar en el celular (PWA)

Con `npm run build && npm run preview` (o desplegado en algún hosting), abre la URL desde
Safari/Chrome en el celular y usa "Añadir a pantalla de inicio" — el `manifest.json` ya está
configurado para que se vea como app.

## Cómo se arma el plan

El calendario ya no es una lista de días escrita a mano: se **genera**.

- `src/data/program.ts` — la semana tipo (qué toca cada día) y las reglas de progresión: cuánto
  sube el fondo cada semana, cada cuánto hay semana de descarga y cuánto se recorta antes de una meta.
- `src/lib/planEngine.ts` — el motor. Genera el plan de cualquier fecha aplicando, en orden:
  día histórico → semana tipo con progresión → meta → festivo.
- `src/data/legacyPlan.ts` — el plan original (15-jul → 5-ago de 2026) escrito a mano. Manda sobre
  lo generado para que el registro ya guardado siga cuadrando.
- `src/data/holidays.ts` — festivos de Colombia calculados (fijos, Ley Emiliani y los de Pascua),
  para cualquier año. En festivo el gimnasio cierra, así que el funcional pasa a descanso.
- `src/data/plan.ts` — la fachada que usan las páginas: `getDayPlan(fecha, meta)` y `getRange(desde, hasta, meta)`.

**Para cambiar el entrenamiento no hay que editar día por día**: se ajusta la semana tipo o la
progresión en `program.ts`, o se cambia la meta desde la propia app.

## Datos

- `src/hooks/useGoals.ts` — tus metas (tabla `goals`).
- `src/hooks/useTrainingLog.ts` — el registro de cada sesión: completada, distancia, duración,
  calorías, actividad y sensación (tabla `training_log`).
- `src/hooks/useSettings.ts` — la nota de recalibración de ritmo (tabla `settings`).
- `src/lib/cloudStore.ts` — caché local + sincronización con Supabase, compartida por los tres.
  Sin conexión (o sin las tablas creadas) la app sigue funcionando con `localStorage`.

### Tabla `goals`

```sql
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  sport text not null default 'running',
  target_km numeric,
  target_date date not null,
  achieved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy goals_own on public.goals for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant all on public.goals to authenticated;
create index goals_user_date_idx on public.goals (user_id, target_date);
```

## Estructura

- `src/pages/` — Hoy, Semana, Detalle de día/sesión, Metas, Progreso, Ajustes.
- `src/components/` — tarjetas y elementos de UI reutilizables.
- `src/lib/dates.ts` — fechas en ISO y ancladas a la hora de Colombia.
- `src/lib/stats.ts` — km, ritmos, categorías y rachas a partir del registro.
