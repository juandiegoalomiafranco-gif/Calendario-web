/**
 * Iconos SVG propios, sin dependencias.
 *
 * Los emojis se veían distinto en cada dispositivo, no se podían colorear y se
 * repetían (🔥 servía a la vez para "Racha" y "Calorías"). Estos heredan el color
 * del texto con `currentColor` y son iguales en todas partes.
 *
 * Los emojis se conservan a propósito donde son contenido y no interfaz: los
 * deportes (🏃🏊🏋️⚽🏐) y las sensaciones (😄🙂😐😖).
 */

export type IconName =
  | 'hoy'
  | 'semana'
  | 'meta'
  | 'progreso'
  | 'ajustes'
  | 'entrenos'
  | 'racha'
  | 'distancia'
  | 'correr'
  | 'tiempo'
  | 'energia'
  | 'regla'
  | 'tendencia'

const PATHS: Record<IconName, string> = {
  hoy: 'M12 4v2m0 12v2M4 12H2m20 0h-2M6.3 6.3 4.9 4.9m14.2 1.4 1.4-1.4M6.3 17.7l-1.4 1.4m14.2-1.4 1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  semana: 'M8 3v4m8-4v4M3.5 9.5h17M5 6h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 5 6Z',
  meta: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  progreso: 'M4 20h16M7 20v-6m5 6V8m5 12v-9',
  ajustes:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2l-.3-2.5h-4l-.3 2.5c-.7.3-1.4.7-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2 1.2l.3 2.5h4l.3-2.5c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
  entrenos: 'M4 9v6m4-8v10m8-10v10m4-8v6M8 12h8',
  racha: 'M12 21c3.3 0 6-2.5 6-5.6 0-3.6-2.6-5.4-3.7-8.9-.9 1.3-1.6 2-2.3 2.5C11 7.6 10.2 5.4 10.7 3 8 4.8 6 8.2 6 12c0 3.6 2.4 9 6 9Z',
  distancia: 'M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  correr: 'M14.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM7 21l3-5 3 2 1.5 3M13 8l-3.5 2L7 14m6-6 3.5 1.5L19 12m-6-4-1.5 5',
  tiempo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3 2',
  energia: 'M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z',
  regla: 'M3.5 9h17a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Zm3 0v3m4-3v4m4-4v3m4-3v4',
  tendencia: 'M3.5 16.5 9 11l3.5 3.5L20.5 6M20.5 6h-5m5 0v5',
}

const FILLED: IconName[] = ['racha', 'energia']

interface IconProps {
  name: IconName
  className?: string
  /** Tamaño en píxeles (por defecto 20). */
  size?: number
}

export function Icon({ name, className = '', size = 20 }: IconProps) {
  const filled = FILLED.includes(name)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
