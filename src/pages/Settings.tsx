import { HeartPulse, Palette } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { AccountSettings } from '../components/AccountSettings'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Field, NumberInput, TextArea } from '../components/ui/Field'
import { ThemeToggle } from '../components/ui/ThemeToggle'

function karvonenZone2(restingHr: number, maxHr: number): string {
  const hrr = maxHr - restingHr
  const low = Math.round(restingHr + hrr * 0.6)
  const high = Math.round(restingHr + hrr * 0.7)
  return `${low}-${high} ppm`
}

export function Settings() {
  const { settings, update } = useSettings()

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title="Ajustes"
        description="Los ritmos y zonas se recalibran a medida que mejora tu base aeróbica. Actualiza esto cada 2-3 semanas."
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Card>
            <CardHeader
              title="Apariencia"
              icon={<Palette size={16} className="text-content-subtle" aria-hidden />}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-content-muted">
                Claro, oscuro o lo que use tu dispositivo.
              </p>
              <ThemeToggle />
            </div>
          </Card>

          <AccountSettings />
        </div>

        <div className="flex flex-col gap-4 lg:gap-5">
          <Card>
            <CardHeader
              title="Frecuencia cardiaca"
              icon={<HeartPulse size={16} className="text-content-subtle" aria-hidden />}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Field label="FC en reposo (ppm)" className="flex-1">
                <NumberInput
                  value={settings.restingHr}
                  onChange={(e) => update({ restingHr: Number(e.target.value) })}
                />
              </Field>
              <Field label="FC máxima estimada/medida (ppm)" className="flex-1">
                <NumberInput
                  value={settings.maxHr}
                  onChange={(e) => update({ maxHr: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="mt-3 rounded-2xl bg-accent-soft p-3.5">
              <p className="text-sm font-semibold text-accent">Tu Zona 2 aeróbica (Karvonen)</p>
              <p className="text-xl font-extrabold tabular text-accent">
                {karvonenZone2(settings.restingHr, settings.maxHr)}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Ritmo" />
            <Field
              label="Ajuste actual de ritmo (opcional)"
              hint="Este apunte es solo para ti — el plan sigue mostrando los rangos originales, pero puedes anotar aquí cómo va cambiando tu ritmo real a la misma FC."
            >
              <TextArea
                value={settings.paceNote}
                onChange={(e) => update({ paceNote: e.target.value })}
                rows={4}
                placeholder="Ej: desde la semana 3, mi rodaje suave ya sale a 7:00-7:30/km con FC en zona 2."
              />
            </Field>
          </Card>
        </div>
      </div>
    </div>
  )
}
