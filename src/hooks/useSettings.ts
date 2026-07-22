import { useCallback, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'

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

// Store compartido a nivel de módulo (caché local + sincronización con Supabase).
let cache: Settings = readStorage()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function persistLocal(next: Settings) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // sin espacio o modo privado: al menos queda en memoria
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// --- Sincronización con Supabase ---------------------------------------------
let currentUserId: string | null = null

async function loadFromSupabase() {
  const { data, error } = await supabase.from('settings').select('*').maybeSingle()
  if (error || !data) return
  persistLocal({
    restingHr: data.resting_hr ?? DEFAULT_SETTINGS.restingHr,
    maxHr: data.max_hr ?? DEFAULT_SETTINGS.maxHr,
    paceNote: data.pace_note ?? '',
  })
}

function pushToSupabase(next: Settings) {
  if (!currentUserId) return
  supabase
    .from('settings')
    .upsert(
      {
        user_id: currentUserId,
        resting_hr: next.restingHr,
        max_hr: next.maxHr,
        pace_note: next.paceNote,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .then(({ error }) => {
      if (error) console.error('No se pudieron guardar los ajustes:', error.message)
    })
}

supabase.auth.getSession().then(({ data }) => {
  currentUserId = data.session?.user.id ?? null
  if (currentUserId) loadFromSupabase()
})
supabase.auth.onAuthStateChange((_event, session) => {
  const nextId = session?.user.id ?? null
  if (nextId === currentUserId) return
  currentUserId = nextId
  if (nextId) loadFromSupabase()
  else persistLocal(DEFAULT_SETTINGS)
})

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, () => cache)

  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...cache, ...patch }
    persistLocal(next)
    pushToSupabase(next)
  }, [])

  return { settings, update }
}
