import { Link } from 'react-router-dom'

interface EmptyStateProps {
  emoji: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

/**
 * Estado vacío con salida: además de explicar qué falta, ofrece el botón que
 * resuelve la situación. Antes las pantallas vacías solo mostraban ceros.
 */
export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: EmptyStateProps) {
  const buttonClass =
    'inline-flex items-center justify-center min-h-[44px] px-5 rounded-full bg-brand-500 text-white font-semibold active:bg-brand-600'

  return (
    <div className="rounded-3xl bg-card shadow-card p-6 flex flex-col items-center text-center gap-2">
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500 max-w-[22rem]">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className={`${buttonClass} mt-2`}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button type="button" onClick={onAction} className={`${buttonClass} mt-2`}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
