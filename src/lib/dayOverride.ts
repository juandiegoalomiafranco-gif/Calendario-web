import { useSyncExternalStore } from 'react'

// Ajuste manual del día "de hoy". Sirve para corregir la fecha a mano cuando la app
// muestra un día que no es (por ejemplo, de noche puede adelantarse un día).
// El ajuste solo vale hasta la medianoche (hora del teléfono): al día siguiente
// vuelve sola la fecha automática.

const STORAGE_KEY = 'calendario-web:day-override:v1'

interface StoredOverride {
  date: string // YYYY-MM-DD elegido a mano
  setOn: string // fecha local (YYYY-MM-DD) del teléfono cuando se hizo el ajuste
}

function localDateISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** La fecha que la app calcula sola (sin ajuste). */
export function automaticDayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function read(): StoredOverride | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredOverride) : null
  } catch {
    return null
  }
}

let cache: StoredOverride | null = read()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** El día elegido a mano, o null si no hay ajuste (o si ya caducó). */
export function getDayOverride(): string | null {
  if (!cache || cache.setOn !== localDateISO()) return null
  return cache.date
}

/** Fija el día a mano. Con null (o si coincide con la fecha automática) se quita el ajuste. */
export function setDayOverride(date: string | null) {
  cache = date && date !== automaticDayISO() ? { date, setOn: localDateISO() } : null
  try {
    if (cache) localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // modo privado o sin espacio: el ajuste queda solo en memoria
  }
  listeners.forEach((l) => l())
}

export function useDayOverride(): string | null {
  return useSyncExternalStore(subscribe, getDayOverride)
}
