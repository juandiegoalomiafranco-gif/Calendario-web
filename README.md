# Mi Vida — organización personal

App personal (Vite + React + TypeScript + Tailwind) que evolucionó desde un calendario de
entrenamiento a un sistema integral de organización, con datos en **Supabase** (Postgres +
RLS), **sesión anónima** por dispositivo (sin login) y un **PIN local** opcional.

## Módulos

- **Hoy** — dashboard: día de ciclo + clases, entreno(s) con completar, comida del día,
  pendientes que vencen y el "Principio del día".
- **Colegio** — ciclo de 6 días (avanza solo en días de colegio, con reinicios), horario
  real Día 1–6, notas por clase (unidad + página de cuaderno) y tareas por urgencia.
- **Entreno** — plan de la semana, estadísticas (km, ritmo, FC, cumplimiento),
  **levantamientos con PR** y **notas de gym** (importante/lesión/general).
- **Comida** — dieta por escenarios (E1–E4) elegida automáticamente por la carga del día,
  con marcar comidas cumplidas, explorar los 4 escenarios y reglas/medidas caseras.
- **Más** →
  - **Progreso corporal** — controles mensuales (composición, 8 pliegues, perímetros),
    metas y tendencias.
  - **Finanzas** — cuentas ilimitadas (CDTs con % mensual), movimientos, transferencias,
    mesada e interés automáticos y gráficas. Moneda COP.
  - **Calendario** — mes + agenda del día, fechas importantes resaltadas.
  - **Pendientes** — tareas con urgencias y filtros.
  - **Semana**, **Estadísticas de entreno** y **Ajustes** (PIN, FC y ritmo).

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Copia `.env.example` a `.env` con los valores **públicos**
de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Requiere **Anonymous
sign-ins** activado en Supabase (Authentication → Providers) para sincronizar con la nube;
sin eso, la app funciona igual pero guarda solo en el dispositivo (`localStorage`).

## Build y despliegue

```bash
npm run build   # tsc estricto + vite
npm run lint
```

Vercel: framework **Vite**, build `npm run build`, output `dist`, env vars anteriores.
Usa `HashRouter`, así que no hacen falta reglas de rewrite.

## Arquitectura de datos

- `src/lib/cloudStore.ts` — stores reutilizables con **caché en localStorage + sync a
  Supabase** (con migración única local→nube). Generaliza el patrón de `useTrainingLog`.
  Cada dominio tiene su hook (`useSchool`, `useBodyProgress`, `useStrength`,
  `useTrainingNotes`, `useNutritionLog`, `useCalendarEvents`, `useFinance`).
- `src/lib/pin.ts` + `src/components/PinGate.tsx` — PIN local de entrada.
- Datos de referencia estáticos: `src/data/plan.ts` (entreno), `schoolTimetable.ts`
  (horario), `nutrition.ts` (dieta), `bodyTypes.ts` (línea base corporal).

### Tablas Supabase (todas con RLS *owner-only* `user_id = auth.uid()`)

`training_log`, `class_notes`, `school_config`, `tasks` (con `class_code`/`urgency`),
`body_controls`, `body_goals`, `strength_logs`, `exercises`, `training_notes`,
`nutrition_log`, `calendar_events`, `accounts`, `transactions`, `transfers`,
`finance_categories`, `settings`, `events`.

## Actualizar el plan

Entreno: `src/data/plan.ts`. Horario del colegio: `src/data/schoolTimetable.ts`. Dieta:
`src/data/nutrition.ts`.
