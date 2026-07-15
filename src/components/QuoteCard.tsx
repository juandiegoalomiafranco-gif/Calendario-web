interface QuoteCardProps {
  text: string
  author: string
}

export function QuoteCard({ text, author }: QuoteCardProps) {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-500 to-brand-300 text-white p-5 shadow-card">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border border-white/20" />
      <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full border border-white/20" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80 mb-1.5">Frase del día</p>
      <p className="text-lg font-semibold leading-snug pr-6">«{text}»</p>
      <p className="text-sm text-white/70 mt-2">— {author}</p>
    </div>
  )
}
