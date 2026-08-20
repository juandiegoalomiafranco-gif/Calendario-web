import { useCallback } from 'react'
import { createSingleton } from '../lib/cloudStore'

export interface Settings {
  restingHr: number
  maxHr: number
  paceNote: string
  /** Hora (0-23, en Colombia) a la que llega el aviso de lo que vence mañana. */
  reminderHour: number
  /** Interruptor de los avisos. El permiso del navegador va aparte, por dispositivo. */
  remindersOn: boolean
}

const DEFAULT_SETTINGS: Settings = {
  restingHr: 55,
  maxHr: 200,
  paceNote: '',
  reminderHour: 19,
  remindersOn: false,
}

interface SettingsRow {
  resting_hr: number | null
  max_hr: number | null
  pace_note: string | null
  reminder_hour: number | null
  reminders_on: boolean | null
}

/**
 * Ajustes del usuario. Pasan por el mismo `createSingleton` que el resto: caché
 * local, cola de salida y Realtime, para que cambiar la hora del aviso en el celular
 * se vea también en el computador.
 */
const store = createSingleton<Settings, SettingsRow>({
  key: 'calendario-web:settings:v1',
  table: 'settings',
  fallback: DEFAULT_SETTINGS,
  rowToValue: (r) => ({
    restingHr: r.resting_hr ?? DEFAULT_SETTINGS.restingHr,
    maxHr: r.max_hr ?? DEFAULT_SETTINGS.maxHr,
    paceNote: r.pace_note ?? '',
    reminderHour: r.reminder_hour ?? DEFAULT_SETTINGS.reminderHour,
    remindersOn: r.reminders_on ?? DEFAULT_SETTINGS.remindersOn,
  }),
  valueToRow: (v, userId) => ({
    user_id: userId,
    resting_hr: v.restingHr,
    max_hr: v.maxHr,
    pace_note: v.paceNote,
    reminder_hour: v.reminderHour,
    reminders_on: v.remindersOn,
  }),
})

export function useSettings() {
  const settings = store.useValue()

  const update = useCallback((patch: Partial<Settings>) => {
    store.update((prev) => ({ ...prev, ...patch }))
  }, [])

  return { settings, update }
}
