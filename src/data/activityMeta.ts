import {
  Dumbbell,
  Footprints,
  type LucideIcon,
  Moon,
  Target,
  Volleyball,
  WavesLadder,
} from 'lucide-react'
import type { SessionType } from './types'

/** Las seis familias de actividad que dan color a toda la app. */
export type ActivityKey = 'run' | 'goal' | 'swim' | 'strength' | 'flex' | 'rest'

export interface ActivityMeta {
  key: ActivityKey
  label: string
  Icon: LucideIcon
  /** Punto de color (mini-calendario, leyenda). */
  dot: string
  /** Bloque tenue: fondo suave + texto del color (bloques del calendario, chips). */
  soft: string
  /** Bloque sólido: fondo del color + texto legible encima. */
  solid: string
  /** Sólo el color de texto. */
  text: string
  /** Borde izquierdo de acento de los bloques del calendario. */
  accent: string
  /** Variable CSS, para SVG y estilos en línea. */
  cssVar: string
}

// Las clases se escriben completas (nunca concatenadas) para que Tailwind las conserve.
export const ACTIVITIES: Record<ActivityKey, ActivityMeta> = {
  run: {
    key: 'run',
    label: 'Running',
    Icon: Footprints,
    dot: 'bg-act-run',
    soft: 'bg-act-soft-run text-act-run',
    solid: 'bg-act-run text-white',
    text: 'text-act-run',
    accent: 'border-l-act-run',
    cssVar: 'rgb(var(--act-run))',
  },
  goal: {
    key: 'goal',
    label: 'Meta 21K',
    Icon: Target,
    dot: 'bg-act-goal',
    soft: 'bg-act-soft-goal text-act-goal',
    solid: 'bg-act-goal text-white',
    text: 'text-act-goal',
    accent: 'border-l-act-goal',
    cssVar: 'rgb(var(--act-goal))',
  },
  swim: {
    key: 'swim',
    label: 'Natación',
    Icon: WavesLadder,
    dot: 'bg-act-swim',
    soft: 'bg-act-soft-swim text-act-swim',
    solid: 'bg-act-swim text-white',
    text: 'text-act-swim',
    accent: 'border-l-act-swim',
    cssVar: 'rgb(var(--act-swim))',
  },
  strength: {
    key: 'strength',
    label: 'Funcional',
    Icon: Dumbbell,
    dot: 'bg-act-strength',
    soft: 'bg-act-soft-strength text-act-strength',
    solid: 'bg-act-strength text-white',
    text: 'text-act-strength',
    accent: 'border-l-act-strength',
    cssVar: 'rgb(var(--act-strength))',
  },
  flex: {
    key: 'flex',
    label: 'Flex',
    Icon: Volleyball,
    dot: 'bg-act-flex',
    soft: 'bg-act-soft-flex text-act-flex',
    solid: 'bg-act-flex text-white',
    text: 'text-act-flex',
    accent: 'border-l-act-flex',
    cssVar: 'rgb(var(--act-flex))',
  },
  rest: {
    key: 'rest',
    label: 'Descanso',
    Icon: Moon,
    dot: 'bg-act-rest',
    soft: 'bg-act-soft-rest text-act-rest',
    solid: 'bg-act-rest text-white',
    text: 'text-act-rest',
    accent: 'border-l-act-rest',
    cssVar: 'rgb(var(--act-rest))',
  },
}

/** Orden en el que se muestran la leyenda y los filtros. */
export const ACTIVITY_ORDER: ActivityKey[] = ['run', 'goal', 'swim', 'strength', 'flex', 'rest']

const SESSION_ACTIVITY: Record<SessionType, ActivityKey> = {
  crossfit: 'strength',
  'running-easy': 'run',
  'running-long': 'run',
  'running-shakeout': 'run',
  'running-goal': 'goal',
  'swim-technique': 'swim',
  'swim-endurance': 'swim',
  flex: 'flex',
  rest: 'rest',
}

/** Nombre corto y específico de cada tipo de sesión (el de la familia es más genérico). */
const SESSION_LABEL: Record<SessionType, string> = {
  crossfit: 'Funcional',
  'running-easy': 'Rodaje suave',
  'running-long': 'Fondo largo',
  'running-shakeout': 'Trote suave',
  'running-goal': 'Meta 21K',
  'swim-technique': 'Nado técnica',
  'swim-endurance': 'Nado resistencia',
  flex: 'Flex (deporte/nado)',
  rest: 'Descanso',
}

export function activityOf(type: SessionType): ActivityMeta {
  return ACTIVITIES[SESSION_ACTIVITY[type]]
}

export function activityKeyOf(type: SessionType): ActivityKey {
  return SESSION_ACTIVITY[type]
}

export function sessionLabel(type: SessionType): string {
  return SESSION_LABEL[type]
}

export const SLOT_LABEL: Record<'AM' | 'PM' | 'ALL', string> = {
  AM: 'Mañana',
  PM: 'Tarde',
  ALL: 'Todo el día',
}
