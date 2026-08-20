import { Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { syncNow } from '../lib/cloudStore'
import { syncLabel, useSyncStatus } from '../lib/syncStatus'
import { cx } from '../lib/cx'

const TONE = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  muted: 'text-content-subtle',
} as const

/**
 * Estado de la sincronización, siempre visible. Un guardado que falla tiene que
 * notarse: antes solo quedaba en la consola y por eso nada llegó nunca a la nube.
 */
export function SyncIndicator({ compact = false }: { compact?: boolean }) {
  const status = useSyncStatus()
  const { text, tone } = syncLabel(status)
  const Icon =
    tone === 'danger'
      ? TriangleAlert
      : !status.online || !status.signedIn
        ? CloudOff
        : status.syncing > 0
          ? RefreshCw
          : Cloud

  return (
    <button
      type="button"
      onClick={syncNow}
      title={
        status.lastError
          ? `Último error: ${status.lastError}`
          : status.lastSyncAt
            ? `Última sincronización: ${new Date(status.lastSyncAt).toLocaleTimeString('es-CO')}`
            : 'Sincronizar ahora'
      }
      aria-label={`${text}. Tocar para sincronizar ahora.`}
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface font-semibold transition-colors hover:bg-surface-2',
        compact ? 'h-8 px-2.5 text-[11px]' : 'h-9 px-3 text-xs',
        TONE[tone],
      )}
    >
      <Icon size={14} className={cx(status.syncing > 0 && 'animate-spin')} aria-hidden />
      {!compact && text}
    </button>
  )
}

/**
 * Aviso de sincronización para móvil, donde no hay barra superior. Solo aparece
 * cuando hay algo que decir, para no meter ruido en una pantalla que está bien.
 */
export function SyncBanner() {
  const status = useSyncStatus()
  const necesitaAtencion =
    !!status.lastError || (status.signedIn && (status.pending > 0 || !status.online))
  if (!necesitaAtencion) return null

  const { text, tone } = syncLabel(status)
  return (
    <button
      type="button"
      onClick={syncNow}
      className={cx(
        'mb-3 flex w-full items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-left text-xs font-semibold lg:hidden',
        TONE[tone],
      )}
    >
      {status.lastError ? (
        <TriangleAlert size={14} aria-hidden />
      ) : (
        <CloudOff size={14} aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <span className="shrink-0 text-content-subtle">Tocar para reintentar</span>
    </button>
  )
}
