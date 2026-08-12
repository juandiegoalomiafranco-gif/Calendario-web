import { Dumbbell, Footprints, Moon, Target, Volleyball, WavesLadder, type LucideIcon } from 'lucide-react'
import { COLORS, type ColorStyles } from './palette'
import type { SessionType } from './types'

interface Meta {
  Icon: LucideIcon
  label: string
  color: ColorStyles
}

/** Icono, nombre y color de cada tipo de sesión de entrenamiento. */
export const SESSION_META: Record<SessionType, Meta> = {
  crossfit: { Icon: Dumbbell, label: 'Funcional', color: COLORS.violet },
  'running-easy': { Icon: Footprints, label: 'Rodaje suave', color: COLORS.orange },
  'running-long': { Icon: Footprints, label: 'Fondo largo', color: COLORS.orange },
  'running-shakeout': { Icon: Footprints, label: 'Trote suave', color: COLORS.amber },
  'running-goal': { Icon: Target, label: 'Meta 21K', color: COLORS.rose },
  'swim-technique': { Icon: WavesLadder, label: 'Nado técnica', color: COLORS.cyan },
  'swim-endurance': { Icon: WavesLadder, label: 'Nado resistencia', color: COLORS.blue },
  flex: { Icon: Volleyball, label: 'Flex (deporte/nado)', color: COLORS.green },
  rest: { Icon: Moon, label: 'Descanso', color: COLORS.slate },
}
