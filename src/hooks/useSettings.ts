import { useEffect, useState } from 'react'

const STORAGE_KEY = 'calendario-web:settings:v1'

export interface Settings {
  restingHr: number
  maxHr: number
  paceNote: string
}

const DEFAULT_SETTINGS: Settings = {
  restingHr: 55,
  maxHr: 200,
  paceNote: '',
}

function readStorage(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => readStorage())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const update = (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch }))

  return { settings, update }
}
