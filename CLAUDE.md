# MyLife

App **personal** de Juan Diego para organizar su vida desde el **celular**: colegio,
tareas, calendario, pendientes y finanzas en un solo sitio (entreno y comida siguen en
el código pero ocultos; ver `MODULOS_OCULTOS` en `navItems.ts`). Se
usa instalada como PWA en el iPhone («Añadir a pantalla de inicio») y también desde el
computador; los dos ven siempre lo mismo.

No es un proyecto de equipo ni un producto: es la app de una persona, con sus datos
reales dentro. Eso manda en cómo se le mete mano.

## Stack

Vite 5 + React 18 + TypeScript + Tailwind 3 · `react-router-dom` con **HashRouter** ·
Supabase (Postgres + RLS) para los datos · `lucide-react` para los iconos ·
service worker solo para notificaciones (`public/sw.js`, **no cachea nada** a propósito).

Desarrollo: `npm install && npm run dev`. Antes de dar algo por bueno:
`npm run build && npm run lint`.

## Dónde vive cada cosa

| Carpeta | Qué hay |
|---|---|
| `src/pages/` | Una pantalla por ruta (20 rutas, ver `src/App.tsx`) |
| `src/components/layout/` | El armazón: `AppShell`, `BottomNav` (móvil), `IconRail` (escritorio), `TopBar` |
| `src/components/inicio/` | El Inicio: tira de días, tarjeta del colegio, horario del día, resúmenes |
| `src/components/ui/` | Piezas compartidas: `Sheet`, `Button`, `Card`, `Field`, `RichText`… |
| `src/hooks/` | Un hook por dominio (`useSchool`, `useFinance`, `useTrainingLog`…) |
| `src/lib/` | Supabase, sincronización, fechas, ciclo del colegio, texto enriquecido |
| `src/data/` | Datos fijos: horario, calendario del colegio, plan de entreno, lonchera |
| `src/styles/` | `tokens.css` (solo colores y sombras) e `index.css` (armazón y reglas táctiles) |
| `supabase/` | Migraciones y Edge Functions: recordatorios, Google (`google-auth`, `google-sync`, `gmail-scan`, código común en `_shared/`) |
| `docs/` | Guías: `GOOGLE.md` (conectar Google y Gmail), `PUENTE-ENTRENADOR.md` |

## Cómo está montada la pantalla

`.app-shell` ocupa **exactamente** la pantalla: va anclado a los cuatro bordes con
`position: fixed; inset: 0` (instalada en el iPhone, `100%`/`dvh` se quedaban cortos y
dejaban una franja vacía abajo). Es una columna: barra superior (escritorio) y **el
contenido con el scroll dentro** (`#app-scroll`). La barra de abajo del celular es una
píldora negra que **flota sobre el contenido** con `position: absolute` dentro del
armazón — **nunca** `fixed` ella misma: como el armazón no se mueve, la barra tampoco
se mueve con el rebote de iOS ni al abrirse el teclado (y se esconde mientras el
teclado está arriba). Detrás lleva un degradado del color de fondo para que lo que pasa
por debajo se desvanezca. El contenido deja abajo el hueco de la barra. Lleva
cuatro pestañas y el «+» de añadir en el centro; «Más» está en la cabecera del Inicio.
Consecuencia práctica: **el scroll no está en `window` ni en `body`**, así que
cualquier cosa que toque scroll tiene que ir contra `#app-scroll` (`SCROLL_AREA_ID` en
`src/components/ScrollToTop.tsx`).

El teclado del celular es el otro caso raro: en iOS **no encoge el viewport**, así que
lo que quede abajo se va detrás del teclado. Lo mide `useKeyboardInset`
(`src/hooks/useKeyboardInset.ts`) y lo usan `AppShell` y `Sheet` para apartarse.

Y aun anclado a los bordes, instalada en algunos iPhone iOS descuenta dos veces la
barra de estado y el viewport se queda ~50 pt corto: queda una franja vacía bajo la
píldora. `src/lib/huecoInferiorIOS.ts` lo mide (solo iPhone instalado, en vertical) y
estira `.app-shell` con `--hueco-ios-abajo`; en cualquier otro caso vale 0. Al final
de Ajustes sale una línea con esas medidas para diagnosticarlo si volviera.

## Arranque

La app tiene que abrir en menos de un segundo, también con mala señal:

- **Con sesión guardada se entra ya** (`CodeGate` + `CLAVE_SESION` en
  `src/lib/supabase.ts`): se pinta desde la caché local y la renovación del token va
  por detrás. Si la nube rechaza la sesión, vuelve la pantalla del código. Nunca
  esperar a la red antes del primer pintado.
- **Pantallas perezosas**: se registran en `src/pantallas.ts`, no se importan directo
  en `App.tsx`. Solo Inicio va en el paquete principal; el resto se precarga tras el
  primer pintado.
- **Trabajo de arranque**: lo que no hace falta para pintar (bajada de tablas,
  Realtime, Google, siembras, service worker) va por `trasPrimerPintado` o
  `cuandoHayaCalma` de `src/lib/arranque.ts`.
- **Animación de inicio**: CSS en línea en `index.html` (pinta antes que el JS);
  `arranque.ts` la retira en cuanto React pinta. No debe añadir espera.
- `vite.config.ts` separa React y Supabase en archivos propios para que su caché
  sobreviva a los despliegues.

## Reglas de la casa

- **Todo en español**: la interfaz, los comentarios, los mensajes de commit y los
  nombres de variables nuevas. El código existente ya es así.
- Los comentarios explican **por qué**, no qué. Los que hay documentan trampas reales
  (iOS, el teclado, la zona segura); no los borres al editar alrededor.
- **Los campos de escribir van a 16 px o más en el celular.** Por debajo, Safari hace
  zoom solo al enfocar y no lo deshace. Está resuelto en el bloque
  `@media (pointer: coarse)` de `src/styles/index.css`; no lo bajes.
- Los colores salen de `tokens.css` vía Tailwind (`bg-surface`, `text-content`…).
  Nunca un color a mano: hay modo claro y oscuro. El acento de «lo activo» es el
  verde lima `brand` (`bg-brand text-brand-on`); las tarjetas destacadas son grafito
  `bg-hero-to text-hero-fg` en los dos temas.
- La letra va con la escala de `tailwind.config.ts` (`text-title`, `text-section`,
  `text-body`, `text-caption`, `text-micro`) y pesos medios; `font-extrabold` casi no
  se usa: con todo en negrita la pantalla se veía saturada.
- Zonas táctiles de 44 px en el celular, también en `@media (pointer: coarse)`.

## Google Calendar y Gmail

Google es una **cuenta vinculada** aparte del login por código: el OAuth y la
sincronización los hacen las Edge Functions, nunca el navegador. Configuración,
funcionamiento y solución de problemas: [`docs/GOOGLE.md`](docs/GOOGLE.md). Lo que hay
que saber antes de tocar código:

- La app **nunca** manda las columnas `google_*`, `gmail_message_id` ni
  `google_pendiente` en su upsert de `calendar_events`: las escribe solo el servidor.
  `google_pendiente` (y en `google_cambios` qué campos) lo pone un trigger cuando el rol
  `authenticated` cambia algo que se sube; la estrella y el tipo no cuentan.
- Solo el dueño conecta Google: el servidor mira `google_permitidos` y a cualquier otra
  cuenta le responde `no_permitido`.
- `source` de un evento: `propio`, `colegio` (nunca sube a Google), `google` o `gmail`.
- Tablas: `google_conexion` (la app lee y cambia `calendarios[].visible` y
  `gmail_activo`), `gmail_procesados` (solo lectura), `google_tokens`,
  `google_oauth_estados` y `google_permitidos` (solo service role; el token va cifrado en
  Vault).
- Las funciones responden `{ok:false, error, detalle?}`: 401 sin credenciales, 403
  `no_permitido`, 200 en los demás errores lógicos. Cada código nuevo necesita su texto
  en `mensajeDeError` (`src/lib/google.ts`).

## Qué NO se toca sin que lo pida él

- **La base de datos**: `supabase/migrations/`, los esquemas y los datos guardados.
- **El diseño**: colores, tipografías, tamaños, distribución de las pantallas. Los
  arreglos de celular se hacen sin que la app se vea distinta.
- **El nombre y los iconos** (`manifest.json`, `apple-touch-icon`): cambiarlos obliga a
  borrar y volver a añadir el icono en el iPhone.
- Los datos fijos de `src/data/` (horario real, calendario del colegio, plan de entreno).

## Despliegue

Vercel, proyecto `calendario-web`, conectado a este repositorio. Producción sale de
`main`; cualquier otra rama genera un despliegue de vista previa.
