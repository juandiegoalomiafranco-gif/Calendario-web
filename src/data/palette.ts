/**
 * Paleta de categorías de MyLife.
 *
 * Un único juego de colores que comparten materias, tipos de evento, urgencias y
 * actividades, para que el mismo color signifique lo mismo en toda la app. Las clases
 * se escriben completas (nunca concatenadas) para que Tailwind no las descarte.
 */

export type ColorKey =
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'fuchsia'
  | 'indigo'
  | 'slate'

export interface ColorStyles {
  key: ColorKey
  /** Nombre en español, para el selector de color al crear una materia. */
  label: string
  /** Punto o barra de color sólida. */
  dot: string
  /** Fondo tenue + texto del color: chips y tarjetas tipo tarea. */
  soft: string
  /** Fondo sólido con texto legible encima. */
  solid: string
  /** Sólo el color de texto. */
  text: string
  /** Borde izquierdo de acento. */
  accent: string
  /** Variable CSS, para SVG y estilos en línea. */
  cssVar: string
}

export const COLORS: Record<ColorKey, ColorStyles> = {
  violet: {
    key: 'violet',
    label: 'Violeta',
    dot: 'bg-cat-violet',
    soft: 'bg-cat-soft-violet text-cat-violet',
    solid: 'bg-cat-violet text-white',
    text: 'text-cat-violet',
    accent: 'border-l-cat-violet',
    cssVar: 'rgb(var(--cat-violet))',
  },
  blue: {
    key: 'blue',
    label: 'Azul',
    dot: 'bg-cat-blue',
    soft: 'bg-cat-soft-blue text-cat-blue',
    solid: 'bg-cat-blue text-white',
    text: 'text-cat-blue',
    accent: 'border-l-cat-blue',
    cssVar: 'rgb(var(--cat-blue))',
  },
  cyan: {
    key: 'cyan',
    label: 'Cian',
    dot: 'bg-cat-cyan',
    soft: 'bg-cat-soft-cyan text-cat-cyan',
    solid: 'bg-cat-cyan text-white',
    text: 'text-cat-cyan',
    accent: 'border-l-cat-cyan',
    cssVar: 'rgb(var(--cat-cyan))',
  },
  teal: {
    key: 'teal',
    label: 'Verde azulado',
    dot: 'bg-cat-teal',
    soft: 'bg-cat-soft-teal text-cat-teal',
    solid: 'bg-cat-teal text-white',
    text: 'text-cat-teal',
    accent: 'border-l-cat-teal',
    cssVar: 'rgb(var(--cat-teal))',
  },
  green: {
    key: 'green',
    label: 'Verde',
    dot: 'bg-cat-green',
    soft: 'bg-cat-soft-green text-cat-green',
    solid: 'bg-cat-green text-white',
    text: 'text-cat-green',
    accent: 'border-l-cat-green',
    cssVar: 'rgb(var(--cat-green))',
  },
  amber: {
    key: 'amber',
    label: 'Ámbar',
    dot: 'bg-cat-amber',
    soft: 'bg-cat-soft-amber text-cat-amber',
    solid: 'bg-cat-amber text-white',
    text: 'text-cat-amber',
    accent: 'border-l-cat-amber',
    cssVar: 'rgb(var(--cat-amber))',
  },
  orange: {
    key: 'orange',
    label: 'Naranja',
    dot: 'bg-cat-orange',
    soft: 'bg-cat-soft-orange text-cat-orange',
    solid: 'bg-cat-orange text-white',
    text: 'text-cat-orange',
    accent: 'border-l-cat-orange',
    cssVar: 'rgb(var(--cat-orange))',
  },
  rose: {
    key: 'rose',
    label: 'Rosa',
    dot: 'bg-cat-rose',
    soft: 'bg-cat-soft-rose text-cat-rose',
    solid: 'bg-cat-rose text-white',
    text: 'text-cat-rose',
    accent: 'border-l-cat-rose',
    cssVar: 'rgb(var(--cat-rose))',
  },
  fuchsia: {
    key: 'fuchsia',
    label: 'Fucsia',
    dot: 'bg-cat-fuchsia',
    soft: 'bg-cat-soft-fuchsia text-cat-fuchsia',
    solid: 'bg-cat-fuchsia text-white',
    text: 'text-cat-fuchsia',
    accent: 'border-l-cat-fuchsia',
    cssVar: 'rgb(var(--cat-fuchsia))',
  },
  indigo: {
    key: 'indigo',
    label: 'Índigo',
    dot: 'bg-cat-indigo',
    soft: 'bg-cat-soft-indigo text-cat-indigo',
    solid: 'bg-cat-indigo text-white',
    text: 'text-cat-indigo',
    accent: 'border-l-cat-indigo',
    cssVar: 'rgb(var(--cat-indigo))',
  },
  slate: {
    key: 'slate',
    label: 'Gris',
    dot: 'bg-cat-slate',
    soft: 'bg-cat-soft-slate text-cat-slate',
    solid: 'bg-cat-slate text-white',
    text: 'text-cat-slate',
    accent: 'border-l-cat-slate',
    cssVar: 'rgb(var(--cat-slate))',
  },
}

/** Orden en el que se ofrecen los colores al crear o editar una materia. */
export const COLOR_ORDER: ColorKey[] = [
  'blue',
  'violet',
  'green',
  'amber',
  'rose',
  'cyan',
  'teal',
  'indigo',
  'fuchsia',
  'orange',
  'slate',
]

/** Devuelve los estilos de un color, con gris como respaldo si la clave no existe. */
export function colorOf(key: string | undefined): ColorStyles {
  return COLORS[(key as ColorKey) ?? 'slate'] ?? COLORS.slate
}
