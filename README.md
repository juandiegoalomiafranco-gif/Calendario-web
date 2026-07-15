# Mi Calendario de Entrenamiento

App personal (Vite + React + TypeScript + Tailwind) con el calendario de entrenamiento de vacaciones: running, natación y funcional organizados por frecuencia cardíaca, no por esfuerzo máximo, con progresión hacia un intento de 21 km el 5 de agosto de 2026.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Build de producción

```bash
npm run build
npm run preview
```

## Instalar en el celular (PWA)

Con `npm run build && npm run preview` (o desplegado en algún hosting), abre la URL desde Safari/Chrome en el celular y usa "Añadir a pantalla de inicio" — el `manifest.json` ya está configurado para que se vea como app.

## Estructura

- `src/data/plan.ts` — el calendario completo (hoy → 5 de agosto), con distancia, ritmo, FC objetivo y el porqué de cada sesión.
- `src/data/types.ts` — tipos del plan y del registro de entrenamientos.
- `src/hooks/useTrainingLog.ts` — registro de sesiones completadas (FC real, distancia real, sensación) en `localStorage`.
- `src/hooks/useSettings.ts` — FC de reposo/máxima y notas de recalibración de ritmo, en `localStorage`.
- `src/pages/` — Hoy, Semana, Detalle de día/sesión, Progreso, Ajustes.
- `src/components/` — tarjetas y elementos de UI reutilizables.

## Actualizar el plan

Cuando cambien los ritmos, las semanas o el objetivo (por ejemplo, después del 5 de agosto), el único archivo que hay que editar es `src/data/plan.ts`.
