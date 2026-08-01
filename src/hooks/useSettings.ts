import { useCallback, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'
import { createCloudStore } from '../lib/cloudStore'

export interface Settings {
  paceNote: string
}

const DEFAULT_SETTINGS: Settings = {
  paceNote: '',
}

// Las columnas `resting_hr` y `max_hr` siguen en la tabla `settings` con lo que
// hubieras guardado, pero la app ya no las lee ni las escribe.
const store = createCloudStore<Settings>({
  storageKey: 'calendario-web:settings:v1',
  initial: DEFAULT_SETTINGS,
  hydrate: (raw) => ({ ...DEFAULT_SETTINGS, ...(raw as Partial<Settings>) }),
  load: async () => {
    const { data, error } = await supabase.from('settings').select('*').maybeSingle()
    if (error || !data) return null
    return { paceNote: data.pace_note ?? '' }
  },
})

function pushSettings(next: Settings) {
  const userId = store.userId()
  if (!userId) return
  void supabase
    .from('settings')
    .upsert(
      {
        user_id: userId,
        pace_note: next.paceNote,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .then(({ error }) => {
      if (error) console.error('No se pudieron guardar los ajustes:', error.message)
    })
}

export function useSettings() {
  const settings = useSyncExternalStore(store.subscribe, store.snapshot)

  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...store.snapshot(), ...patch }
    store.setLocal(next)
    pushSettings(next)
  }, [])

  return { settings, update }
}
