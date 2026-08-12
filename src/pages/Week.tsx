import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PLAN, todayISO } from '../data/plan'
import { WeekGrid } from '../components/WeekGrid'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { chunkIntoWeeks } from '../lib/weeks'
import { formatDayMonth } from '../lib/dates'

export function Week() {
  const iso = todayISO()
  const weeks = useMemo(() => chunkIntoWeeks(PLAN), [])
  const currentWeekIdx = useMemo(() => {
    const idx = weeks.findIndex((w) => w.some((d) => d.date === iso))
    return idx >= 0 ? idx : 0
  }, [weeks, iso])
  const [weekIdx, setWeekIdx] = useState(currentWeekIdx)

  const week = weeks[weekIdx] ?? []
  const from = week[0]?.date
  const to = week[week.length - 1]?.date
  const isCurrent = weekIdx === currentWeekIdx

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow="Entreno"
        title="Semana"
        description={`Semana ${weekIdx + 1} de ${weeks.length}${isCurrent ? ' · la de hoy' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {!isCurrent && (
              <Button variant="outline" onClick={() => setWeekIdx(currentWeekIdx)}>
                Semana actual
              </Button>
            )}
            <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
                disabled={weekIdx === 0}
                aria-label="Semana anterior"
              >
                <ChevronLeft size={17} aria-hidden />
              </Button>
              <span className="min-w-[9rem] px-2 text-center text-sm font-semibold text-content">
                {from && to ? `${formatDayMonth(from)} – ${formatDayMonth(to)}` : '—'}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
                disabled={weekIdx === weeks.length - 1}
                aria-label="Semana siguiente"
              >
                <ChevronRight size={17} aria-hidden />
              </Button>
            </div>
          </div>
        }
      />

      <WeekGrid days={week} todayIso={iso} />
    </div>
  )
}
