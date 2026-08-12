import { Quote } from 'lucide-react'

/** Principio del día: la única pieza con fondo sólido oscuro, como acento del bento. */
export function PrincipleCard({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-on shadow-card sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-primary-on/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent/20" />

      <Quote size={18} className="mb-2 opacity-60" aria-hidden />
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Principio del día</p>
      <p className="mt-1.5 max-w-prose text-lg font-bold leading-snug tracking-tight">{text}</p>
    </div>
  )
}
