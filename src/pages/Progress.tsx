import { useSearchParams } from 'react-router-dom'
import { PlanTab } from '../components/progress/PlanTab'
import { MeasurementsTab } from '../components/progress/MeasurementsTab'
import { GoalsTab } from '../components/progress/GoalsTab'

const TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'medidas', label: 'Medidas' },
  { id: 'objetivo', label: 'Objetivo' },
] as const

type TabId = (typeof TABS)[number]['id']

export function Progress() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab')
  const tab: TabId = raw === 'medidas' || raw === 'objetivo' ? raw : 'plan'

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Progreso</h1>
      </header>

      <div className="flex rounded-full bg-card p-1 shadow-card">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSearchParams(t.id === 'plan' ? {} : { tab: t.id }, { replace: true })}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-brand-500 text-white' : 'text-ink-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plan' && <PlanTab />}
      {tab === 'medidas' && <MeasurementsTab />}
      {tab === 'objetivo' && <GoalsTab />}
    </div>
  )
}
