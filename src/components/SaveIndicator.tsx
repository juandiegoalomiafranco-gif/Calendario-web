import { useSyncState } from '../hooks/useStores'

const LABELS: Record<string, { text: string; className: string }> = {
  saving: { text: 'Guardando…', className: 'text-ink-500' },
  saved: { text: 'Guardado ✓', className: 'text-ok-400' },
  offline: { text: 'Sin conexión — guardado aquí', className: 'text-amber-400' },
  error: { text: 'No se pudo guardar', className: 'text-danger-400' },
}

/**
 * Antes cada tecla disparaba un upsert y nada le decía al usuario si había
 * guardado. Este indicador lee el estado agregado de los stores.
 */
export function SaveIndicator() {
  const state = useSyncState()
  const label = LABELS[state]
  if (!label) return null

  return (
    <p className={`text-xs font-medium ${label.className}`} role="status" aria-live="polite">
      {label.text}
    </p>
  )
}
