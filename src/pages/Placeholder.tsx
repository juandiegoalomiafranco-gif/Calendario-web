export function Placeholder({ title, emoji = '🚧' }: { title: string; emoji?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <p className="text-4xl">{emoji}</p>
      <h1 className="text-2xl font-bold text-ink-900 font-display">{title}</h1>
      <p className="text-sm text-ink-500">Próximamente.</p>
    </div>
  )
}
