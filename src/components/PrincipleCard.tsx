import { Quote } from 'lucide-react'

/** Principio del día: la única pieza con fondo de marca a pantalla completa. */
export function PrincipleCard({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand to-brand-strong p-5 text-white shadow-card sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />

      <Quote size={18} className="mb-2 opacity-70" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
        Principio del día
      </p>
      <p className="mt-1.5 max-w-prose text-lg font-semibold leading-snug tracking-tight">{text}</p>
    </div>
  )
}
