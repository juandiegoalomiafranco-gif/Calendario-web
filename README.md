# Mis Finanzas

App personal (Vite + React + TypeScript + Tailwind + Supabase) para llevar toda la plata en un solo lugar: cuentas y saldos, ingresos y gastos, presupuesto mensual por categoría y metas de ahorro. Instalable como PWA y funciona sin conexión.

Los montos en pesos colombianos (COP).

## Desarrollo

```bash
npm install
cp .env.example .env   # y rellena los valores de tu proyecto Supabase
npm run dev
```

Abre `http://localhost:5173`.

Si arrancas sin `.env`, la app carga igual y muestra un aviso explicando qué falta — no se queda en blanco.

## Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega el contenido de `supabase/migrations/0001_finanzas.sql` y ejecútalo. Eso crea las cuatro tablas con RLS: solo puedes leer y escribir tus propias filas.
3. En **Authentication → Providers**, deja activado **Email**. La app usa correo y contraseña.
4. Copia la URL del proyecto y la *publishable key* (botón **Connect**, o Settings → API Keys) a tu `.env`.

Solo valores públicos van en `.env`. La *publishable key* es segura en el navegador porque las tablas están protegidas por RLS; la *secret key* no va nunca en el cliente. `.env` está en `.gitignore` — no lo subas al repo.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build        # tsc -b + vite build
npm run preview      # sirve el build de producción
npm test             # tests de la lógica financiera (vitest)
npm run lint         # eslint
```

## Instalar en el celular

Con el build desplegado (o `npm run build && npm run preview`), abre la URL en Safari/Chrome del celular y usa "Añadir a pantalla de inicio". El service worker precachea el shell, así que la app abre incluso sin señal; los movimientos que anotes sin conexión se guardan localmente y se suben cuando vuelve la red.

## Estructura

- `src/lib/finanzas.ts` — toda la matemática: saldo por cuenta, patrimonio, resumen del mes, gasto por categoría, estado del presupuesto y avance de metas. Funciones puras, con tests en `finanzas.test.ts`.
- `src/lib/createSyncedStore.ts` — store compartido: caché en localStorage, fusión con Supabase por `updatedAt` y cola de reintentos para lo que se escribió sin conexión.
- `src/lib/dates.ts` — fechas en hora **local**, no UTC. Con UTC, en Colombia (UTC-5) un gasto anotado a las 8 p.m. caía al día siguiente.
- `src/lib/format.ts` — montos en COP y lectura tolerante de lo que el usuario escribe (`1.250.000`, `$ 45 000`, `1,500,000`).
- `src/lib/backup.ts` — export e import del respaldo JSON.
- `src/hooks/useStores.ts` — los cuatro stores (cuentas, movimientos, presupuestos, metas) y sus hooks.
- `src/hooks/useAuth.ts` — sesión, registro, recuperación de contraseña.
- `src/pages/` — Login, Bienvenida (configuración inicial), Resumen, Movimientos, formulario de movimiento, Presupuesto, Metas, Ajustes.
- `src/components/` — tarjetas, selector de categorías, campo de monto, navegador de mes y gráficas.
- `supabase/migrations/` — el SQL del esquema con las políticas RLS.

## Cómo se calculan los saldos

El saldo de una cuenta es `saldo inicial + ingresos − gastos ± transferencias`. El saldo inicial es lo que la cuenta tenía el día que la registraste; a partir de ahí solo hay que anotar movimientos.

El patrimonio total suma los saldos de las cuentas activas, y las de tipo tarjeta de crédito **restan**, porque son deuda. Una transferencia entre cuentas propias no cambia el patrimonio: mueve la plata de lugar.

## Nota

`public/invitacion/` es una página estática aparte, sin relación con la app de finanzas. El service worker la excluye para que se sirva tal cual.
