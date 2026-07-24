# Mi Vida — organización personal

App personal (Vite + React + TypeScript + Tailwind) que evoluciona desde el calendario de
entrenamiento hacia un sistema integral de organización: **Entrenamiento**, **Colegio**
(ciclo de 6 días), **Pendientes** y, en camino, Nutrición y Finanzas. Los datos se
respaldan en **Supabase** (Postgres + RLS) con **sesión anónima** por dispositivo (sin
login) y un **PIN local** opcional para proteger la app al abrirla.

El plan de entrenamiento organiza running, natación y funcional por frecuencia cardíaca
(no por esfuerzo máximo), con progresión hacia un intento de 21 km el 5 de agosto de 2026.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Copia `.env.example` a `.env` y rellena los valores **públicos** de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XXXXXXXX
```

> Solo valores públicos. La `publishable key` es segura en el navegador porque las tablas
> están protegidas por RLS (`user_id = auth.uid()`). Nunca pongas aquí la `secret key`.
> Requiere tener activado **Anonymous sign-ins** en Supabase (Authentication → Providers).

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

1. Conecta el repo de GitHub en Vercel (framework **Vite**, build `npm run build`,
   output `dist`).
2. Añade las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en el
   proyecto de Vercel.
3. Deploy. La app usa `HashRouter`, así que **no** hacen falta reglas de rewrite.

## Instalar en el celular (PWA)

Con `npm run build && npm run preview` (o desplegado en Vercel), abre la URL desde
Safari/Chrome en el celular y usa "Añadir a pantalla de inicio" — el `manifest.json` ya
está configurado para que se vea como app.

## Estructura

- `src/data/plan.ts` — el calendario de entrenamiento (hoy → 5 de agosto).
- `src/data/schoolTimetable.ts` — horario real del Colegio (ciclo Día 1–6) y materias.
- `src/lib/cycle.ts` — cálculo del día de ciclo (avanza solo en días de colegio).
- `src/lib/cloudStore.ts` — stores con caché local + sincronización con Supabase (base
  reutilizable para los módulos; generaliza el patrón de `useTrainingLog`).
- `src/lib/pin.ts` + `src/components/PinGate.tsx` — PIN local de entrada.
- `src/hooks/` — datos por dominio (`useTrainingLog`, `useSchool`, `useSettings`).
- `src/pages/` — Hoy (dashboard), Semana, Detalle de día, Colegio, Detalle de clase,
  Progreso, Ajustes.

## Base de datos (Supabase)

Tablas con RLS *owner-only* (`user_id = auth.uid()`): `training_log`, `tasks` (con
`class_code`/`urgency`/`due_date` para las tareas de Colegio), `class_notes`,
`school_config`, `settings`, `events`. Los cambios de esquema se aplican como
migraciones en el proyecto Supabase.

## Actualizar el plan

Cuando cambien los ritmos, las semanas o el objetivo (por ejemplo, después del 5 de
agosto), el archivo del plan de entrenamiento es `src/data/plan.ts`. El horario del
colegio vive en `src/data/schoolTimetable.ts`.
