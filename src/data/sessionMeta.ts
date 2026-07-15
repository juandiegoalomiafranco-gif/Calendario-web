import type { SessionType } from './types'

interface Meta {
  emoji: string
  label: string
  bg: string
  text: string
  dot: string
}

export const SESSION_META: Record<SessionType, Meta> = {
  crossfit: { emoji: '🏋️', label: 'Funcional', bg: 'bg-zinc-700', text: 'text-white', dot: 'bg-zinc-400' },
  'running-easy': { emoji: '🏃', label: 'Rodaje suave', bg: 'bg-brand-500', text: 'text-white', dot: 'bg-brand-500' },
  'running-long': { emoji: '🏃', label: 'Fondo largo', bg: 'bg-brand-400', text: 'text-white', dot: 'bg-brand-400' },
  'running-shakeout': { emoji: '🏃', label: 'Trote suave', bg: 'bg-brand-200', text: 'text-ink-900', dot: 'bg-brand-200' },
  'running-goal': { emoji: '🎯', label: 'Meta 21K', bg: 'bg-brand-300', text: 'text-white', dot: 'bg-brand-300' },
  'swim-technique': { emoji: '🏊', label: 'Nado técnica', bg: 'bg-sky-500', text: 'text-white', dot: 'bg-sky-500' },
  'swim-endurance': { emoji: '🏊', label: 'Nado resistencia', bg: 'bg-sky-600', text: 'text-white', dot: 'bg-sky-600' },
  futbol: { emoji: '⚽', label: 'Fútbol', bg: 'bg-emerald-600', text: 'text-white', dot: 'bg-emerald-600' },
  voley: { emoji: '🏐', label: 'Vóley', bg: 'bg-amber-500', text: 'text-white', dot: 'bg-amber-500' },
  flex: { emoji: '⚽', label: 'Flex (deporte/nado)', bg: 'bg-ink-200', text: 'text-ink-900', dot: 'bg-ink-400' },
  rest: { emoji: '😴', label: 'Descanso', bg: 'bg-ink-100', text: 'text-ink-700', dot: 'bg-ink-300' },
}
