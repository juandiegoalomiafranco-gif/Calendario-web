# MyLife

App **personal** de Juan Diego para organizar su vida desde el **celular**: colegio,
tareas, entrenamiento, comida, calendario, pendientes y finanzas en un solo sitio. Se
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
| `src/components/ui/` | Piezas compartidas: `Sheet`, `Button`, `Card`, `Field`, `RichText`… |
| `src/hooks/` | Un hook por dominio (`useSchool`, `useFinance`, `useTrainingLog`…) |
| `src/lib/` | Supabase, sincronización, fechas, ciclo del colegio, texto enriquecido |
| `src/data/` | Datos fijos: horario, calendario del colegio, plan de entreno, lonchera |
| `src/styles/` | `tokens.css` (solo colores y sombras) e `index.css` (armazón y reglas táctiles) |
| `supabase/` | Migraciones y la función de recordatorios |

## Cómo está montada la pantalla

`.app-shell` mide **exactamente** `100dvh` y es una columna: barra superior (escritorio),
**el contenido con el scroll dentro** (`#app-scroll`) y la barra inferior abajo. La barra
de abajo **no** es `position: fixed` — es hermana del contenido, y por eso no se mueve
con el rebote de iOS ni al abrirse el teclado. Consecuencia práctica: **el scroll no
está en `window` ni en `body`**, así que cualquier cosa que toque scroll tiene que ir
contra `#app-scroll` (`SCROLL_AREA_ID` en `src/components/ScrollToTop.tsx`).

El teclado del celular es el otro caso raro: en iOS **no encoge el viewport**, así que
lo que quede abajo se va detrás del teclado. Lo mide `useKeyboardInset`
(`src/hooks/useKeyboardInset.ts`) y lo usan `AppShell` y `Sheet` para apartarse.

## Reglas de la casa

- **Todo en español**: la interfaz, los comentarios, los mensajes de commit y los
  nombres de variables nuevas. El código existente ya es así.
- Los comentarios explican **por qué**, no qué. Los que hay documentan trampas reales
  (iOS, el teclado, la zona segura); no los borres al editar alrededor.
- **Los campos de escribir van a 16 px o más en el celular.** Por debajo, Safari hace
  zoom solo al enfocar y no lo deshace. Está resuelto en el bloque
  `@media (pointer: coarse)` de `src/styles/index.css`; no lo bajes.
- Los colores salen de `tokens.css` vía Tailwind (`bg-surface`, `text-content`…).
  Nunca un color a mano: hay modo claro y oscuro.
- Zonas táctiles de 44 px en el celular, también en `@media (pointer: coarse)`.

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
