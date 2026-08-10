import { useCallback, useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

// Debe coincidir con el script inline de index.html, que aplica el tema antes del
// primer pintado para evitar el destello al recargar.
const STORAGE_KEY = 'calendario-web:theme:v1'

function readStorage(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
  } catch {
    return 'system'
  }
}

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function resolve(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') return media?.matches ? 'dark' : 'light'
  return pref
}

// Store compartido a nivel de módulo, igual que useSettings/useTrainingLog.
let cache: ThemePreference = readStorage()
const listeners = new Set<() => void>()

function apply(pref: ThemePreference) {
  const resolved = resolve(pref)
  document.documentElement.setAttribute('data-theme', resolved)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#0b0b0d' : '#f6f4f1')
}

function emit() {
  listeners.forEach((l) => l())
}

// Si la preferencia es "sistema", seguimos los cambios del sistema operativo en vivo.
media?.addEventListener('change', () => {
  if (cache === 'system') {
    apply(cache)
    emit()
  }
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme() {
  const preference = useSyncExternalStore(
    subscribe,
    () => cache,
    () => 'system' as ThemePreference,
  )

  const setPreference = useCallback((next: ThemePreference) => {
    cache = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // modo privado o sin espacio: el tema sigue aplicándose en esta sesión
    }
    apply(next)
    emit()
  }, [])

  return { preference, resolved: resolve(preference), setPreference }
}
