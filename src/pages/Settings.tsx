import { Heart, Info, Palette, Timer } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { Card } from '../components/ui/Card'
import { Field, NumberInput, TextArea } from '../components/ui/Field'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { GOAL_DISTANCE_KM } from '../data/plan'
import { PLAN_END, PLAN_START } from '../lib/planQuery'
import { formatDayMonth } from '../lib/dates'
import { cx } from '../lib/cx'

/** Zonas de FC por el método Karvonen (sobre la reserva cardíaca). */
const ZONES = [
  { name: 'Z1', label: 'Recuperación', from: 0.5, to: 0.6, color: 'bg-act-rest' },
  { name: 'Z2', label: 'Aeróbico / base', from: 0.6, to: 0.7, color: 'bg-ok' },
  { name: 'Z3', label: 'Ritmo medio', from: 0.7, to: 0.8, color: 'bg-warn' },
  { name: 'Z4', label: 'Umbral', from: 0.8, to: 0.9, color: 'bg-act-run' },
  { name: 'Z5', label: 'Máximo', from: 0.9, to: 1, color: 'bg-act-goal' },
]

function zoneRange(restingHr: number, maxHr: number, from: number, to: number): string {
  const hrr = maxHr - restingHr
  return `${Math.round(restingHr + hrr * from)}–${Math.round(restingHr + hrr * to)}`
}

function SectionTitle({ Icon, children }: { Icon: typeof Heart; children: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-content-muted">
        <Icon size={16} strokeWidth={2.2} aria-hidden />
      </span>
      <h2 className="text-base font-semibold tracking-tight text-content">{children}</h2>
    </div>
  )
}

export function Settings() {
  const { settings, update } = useSettings()
  const { restingHr, maxHr } = settings
  const valid = maxHr > restingHr

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-content lg:text-4xl">Ajustes</h1>
        <p className="mt-1 max-w-prose text-sm text-content-muted">
          Los ritmos y zonas se recalibran a medida que mejora tu base aeróbica. Actualiza esto cada
          2-3 semanas.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card padding="lg">
          <SectionTitle Icon={Heart}>Frecuencia cardíaca</SectionTitle>

          <div className="grid grid-cols-2 gap-3">
            <Field label="FC en reposo (ppm)">
              <NumberInput
                inputMode="numeric"
                value={restingHr}
                onChange={(e) => update({ restingHr: Number(e.target.value) })}
              />
            </Field>
            <Field label="FC máxima (ppm)">
              <NumberInput
                inputMode="numeric"
                value={maxHr}
                onChange={(e) => update({ maxHr: Number(e.target.value) })}
              />
            </Field>
          </div>

          {valid ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-content-muted">
                Tus zonas (Karvonen) — el plan trabaja sobre todo en Z2
              </p>
              <div className="flex h-2 overflow-hidden rounded-full">
                {ZONES.map((z) => (
                  <div key={z.name} className={cx('flex-1', z.color)} />
                ))}
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {ZONES.map((z) => (
                  <li
                    key={z.name}
                    className={cx(
                      'flex items-center gap-2.5 rounded-xl px-2 py-1.5',
                      z.name === 'Z2' && 'bg-ok-soft',
                    )}
                  >
                    <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', z.color)} />
                    <span className="w-6 text-xs font-semibold text-content">{z.name}</span>
                    <span className="flex-1 truncate text-xs text-content-muted">{z.label}</span>
                    <span className="text-xs font-semibold tabular text-content">
                      {zoneRange(restingHr, maxHr, z.from, z.to)} ppm
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-warn-soft p-3 text-xs text-content-muted">
              La FC máxima debe ser mayor que la de reposo para calcular las zonas.
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card padding="lg">
            <SectionTitle Icon={Timer}>Ritmo</SectionTitle>
            <Field
              label="Ajuste actual de ritmo (opcional)"
              hint="Este apunte es solo para ti — el plan sigue mostrando los rangos originales, pero puedes anotar aquí cómo va cambiando tu ritmo real a la misma FC."
            >
              <TextArea
                rows={4}
                value={settings.paceNote}
                onChange={(e) => update({ paceNote: e.target.value })}
                placeholder="Ej: desde la semana 3, mi rodaje suave ya sale a 7:00-7:30/km con FC en zona 2."
              />
            </Field>
          </Card>

          <Card padding="lg">
            <SectionTitle Icon={Palette}>Apariencia</SectionTitle>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-content-muted">Tema de la aplicación</p>
              <ThemeToggle />
            </div>
          </Card>

          <Card padding="lg">
            <SectionTitle Icon={Info}>Acerca de</SectionTitle>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Plan</dt>
                <dd className="font-medium text-content">
                  {formatDayMonth(PLAN_START)} → {formatDayMonth(PLAN_END)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Meta</dt>
                <dd className="font-medium text-content">{GOAL_DISTANCE_KM} km seguidos</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Guardado</dt>
                <dd className="font-medium text-content">en este dispositivo y en la nube</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
