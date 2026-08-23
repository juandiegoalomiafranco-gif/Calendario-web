# MyLife — organización personal

App personal (Vite + React + TypeScript + Tailwind) para el colegio, el entreno, la
comida, los pendientes y la plata. Datos en **Supabase** (Postgres + RLS), pensada
para **una persona en dos dispositivos**: el celular y el computador ven siempre lo
mismo.

## Módulos

- **Hoy** — dashboard: día de ciclo + clases, entreno(s), comida del día, pendientes
  que vencen y el "Principio del día".
- **Colegio** — ciclo de 6 días que avanza solo en días de clase, horario del ciclo
  con botón para añadir tarea en cada clase, notas por materia y unidades.
  - Las **notas** son documentos: viñetas, listas numeradas, negrita, cursiva,
    subrayado, resaltado y títulos, con guardado automático.
  - Las **unidades** viven en la materia, se crean desde el formulario de nota y
    sirven para filtrar y agrupar.
  - Las **horas** dependen del día de la semana: el miércoles se sale a la 1:00 pm
    con un solo recreo (editable en «Materias y horario → Horas»).
- **Pendientes** — Colegio · Personal · Todo. Lo del colegio por materia y tipo
  (tarea, examen, quiz, entrega); lo personal por área (Casa, Familia, Salud,
  Compras, Papeleo, Amigos). Todo con grado de importancia.
- **Calendario** — mes + agenda del día. El **calendario oficial del CCB 2026-2027**
  de Secundaria y 11º viene sembrado.
- **Entreno** — plan de la semana, estadísticas, levantamientos con PR y notas de gym.
- **Comida** — dieta por escenarios (E1-E4) según la carga del día, y **«Qué llevar
  hoy al colegio»**: lonchera con gramos para el recreo y el almuerzo, con varias
  opciones por franja y una versión corta para los miércoles.
- **Más** → Progreso corporal, **Finanzas**, Semana, Estadísticas y **Ajustes**
  (cuenta, avisos, entrenador, FC y ritmo).

### Finanzas

Cada movimiento dice **de quién es la plata**. Lo que pagan los papás se registra con
su categoría pero no toca ningún saldo: su plata no es tu patrimonio. El resumen del
mes muestra por separado lo que entró, lo que gastaste de tu plata, lo que gastaste
de la de ellos y el neto, y el desglose por categoría se puede filtrar por fuente.
Categorías editables. Moneda COP.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # tsc estricto + vite
npm run lint
```

Copia `.env.example` a `.env` con los valores **públicos** de Supabase
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) y la clave pública VAPID
(`VITE_VAPID_PUBLIC_KEY`).

Vercel: framework **Vite**, build `npm run build`, output `dist`, y esas mismas env
vars. Usa `HashRouter`, así que no hacen falta reglas de rewrite.

## Cuenta y sincronización

No hay sesión anónima: se entra con un **código**. El mismo código escrito en el
celular y en el computador abre los mismos datos, porque una sesión anónima crea una
cuenta distinta por dispositivo y nunca podría sincronizar nada.

Requiere en Supabase: **Authentication → Providers → Email ON** y **«Confirm email»
OFF** (el email es interno y derivado del código; no se envía ningún correo).

`src/lib/cloudStore.ts` es la capa de datos:

- **bajada incremental** con cursor `updated_at`, en vez de leer todo una vez al arrancar,
- **Realtime**, para que un cambio en un dispositivo aparezca en el otro sin recargar,
- **cola de salida** persistida en `localStorage`, que se reintenta al volver la
  conexión, al volver a la pestaña y cada 30 s, así lo escrito sin señal no se pierde,
- **borrado suave** (`deleted_at`), para que un dato borrado no resucite desde la
  caché del otro dispositivo,
- **conflictos** por `updated_at`, que pone el servidor: gana el último en escribir.

El estado de la sincronización se ve en la barra superior y en Ajustes.

## Avisos (push)

Un aviso al día con lo que vence mañana. En iPhone **solo funciona con la app añadida
a la pantalla de inicio** (iOS 16.4+).

- `public/sw.js` — service worker; solo notificaciones, no cachea nada.
- `supabase/functions/send-reminders/` — Edge Function que arma y manda el aviso.
  Implementa Web Push (RFC 8291/8292) sobre Web Crypto, sin dependencias.
- `pg_cron` la llama cada hora; cada usuario recibe el aviso a la hora que escogió,
  medida en Colombia. Esa llamada diaria además mantiene el proyecto despierto: el
  plan gratuito de Supabase pausa los que llevan días sin actividad.
- Las claves VAPID y el token del cron viven en la tabla `app_secrets`, con RLS y sin
  políticas: solo la service role las lee.

## Entrenador

`docs/PUENTE-ENTRENADOR.md` explica lo que tiene que añadir la app de su entrenador
para publicarle el plan de la semana. El «código de atleta» es una llave de una sola
dirección: con él se puede enviar un plan, nunca leer nada.

## Fechas y horas

Todo «hoy» y «ahora» se resuelve en **América/Bogotá** (`src/lib/dates.ts`), no en UTC
ni en la hora del dispositivo. La aritmética entre fechas ISO sí es UTC, para que una
fecha signifique siempre lo mismo.

El ciclo de 6 días está anclado en el **miércoles 19 de agosto de 2026 = Día 2** y
avanza solo en días de clase: no cuenta fines de semana, festivos de Colombia
(`src/data/holidays.ts`) ni los días sin clase del colegio
(`src/data/schoolCalendar.ts`: Recess Week, Semana Santa, Professional Development
Days y vacaciones).

## Base de datos

Las migraciones están en `supabase/migrations/`. Todas las tablas llevan RLS
*owner-only* (`user_id = auth.uid()`).

`training_log`, `class_notes`, `school_config`, `tasks`, `body_controls`,
`body_goals`, `strength_logs`, `exercises`, `training_notes`, `nutrition_log`,
`calendar_events`, `accounts`, `transactions`, `transfers`, `finance_categories`,
`settings`, `events`, `push_subscriptions`, `athlete_codes`, `coach_plans`,
`app_secrets`.

## Actualizar los datos de referencia

Entreno: `src/data/plan.ts`. Horario del colegio: `src/data/schoolTimetable.ts`.
Calendario escolar: `src/data/schoolCalendar.ts`. Dieta: `src/data/nutrition.ts`.
Lonchera: `src/data/lonchera.ts`.
