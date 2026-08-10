interface HolidayBadgeProps {
  name: string
  /** `true` en las vistas compactas, donde solo cabe la etiqueta. */
  short?: boolean
  className?: string
}

/** El mismo distintivo de festivo que antes estaba copiado en Hoy, Semana y Detalle. */
export function HolidayBadge({ name, short = false, className = '' }: HolidayBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-brand-tint text-brand-200 ${className}`}
      title={name}
    >
      🇨🇴 Festivo{short ? '' : ` · ${name}`}
    </span>
  )
}
