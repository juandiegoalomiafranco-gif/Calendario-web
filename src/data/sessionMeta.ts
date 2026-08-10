import type { SessionType } from './types'

interface Meta {
  emoji: string
  bg: string
  text: string
  dot: string
}

export const SESSION_META: Record<SessionType, Meta> = {
  crossfit: { emoji: '🏋️', bg: 'bg-ink-200', text: 'text-white', dot: 'bg-ink-500' },
  'running-easy': { emoji: '🏃', bg: 'bg-brand-500', text: 'text-white', dot: 'bg-brand-500' },
  'running-long': { emoji: '🏃', bg: 'bg-brand-600', text: 'text-white', dot: 'bg-brand-600' },
  'running-shakeout': { emoji: '🏃', bg: 'bg-brand-300', text: 'text-ink-900', dot: 'bg-brand-300' },
  'running-goal': { emoji: '🎯', bg: 'bg-brand-700', text: 'text-white', dot: 'bg-brand-700' },
  'swim-technique': { emoji: '🏊', bg: 'bg-sky-500', text: 'text-white', dot: 'bg-sky-500' },
  'swim-endurance': { emoji: '🏊', bg: 'bg-sky-600', text: 'text-white', dot: 'bg-sky-600' },
  flex: { emoji: '⚽', bg: 'bg-ink-200', text: 'text-ink-900', dot: 'bg-ink-400' },
  rest: { emoji: '😴', bg: 'bg-ink-100', text: 'text-ink-700', dot: 'bg-ink-300' },
}
