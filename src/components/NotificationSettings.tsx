import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, Send, Share } from 'lucide-react'
import {
  activarPush,
  avisoDePrueba,
  desactivarPush,
  estadoDePush,
  type PushEstado,
} from '../lib/push'
import { useSettings } from '../hooks/useSettings'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { Field, Select } from './ui/Field'

const HORAS = Array.from({ length: 24 }, (_, h) => h)

function horaLegible(h: number): string {
  const suf = h < 12 ? 'a. m.' : 'p. m.'
  const doce = h % 12 === 0 ? 12 : h % 12
  return `${doce}:00 ${suf}`
}

/** Avisos de exámenes, entregas y eventos del colegio en el celular. */
export function NotificationSettings() {
  const { settings, update } = useSettings()
  const [estado, setEstado] = useState<PushEstado | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const refrescar = useCallback(() => {
    void estadoDePush().then(setEstado)
  }, [])

  useEffect(refrescar, [refrescar])

  async function activar() {
    setOcupado(true)
    setMensaje(null)
    const r = await activarPush()
    setEstado(r.estado)
    if (r.ok) update({ remindersOn: true })
    else if (r.error) setMensaje(r.error)
    setOcupado(false)
  }

  async function desactivar() {
    setOcupado(true)
    await desactivarPush()
    update({ remindersOn: false })
    refrescar()
    setOcupado(false)
  }

  return (
    <Card>
      <CardHeader
        title="Avisos"
        icon={<Bell size={16} className="text-content-subtle" aria-hidden />}
      />

      <p className="mb-3 text-sm text-content-muted">
        Un aviso al día con lo que vence mañana: exámenes, entregas, tareas y los eventos
        importantes del colegio.
      </p>

      {estado === 'requiere-instalar' && (
        <div className="mb-3 flex items-start gap-2.5 rounded-2xl bg-warn-soft p-3.5">
          <Share size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden />
          <p className="text-xs leading-relaxed text-warn">
            En iPhone los avisos solo funcionan con la app instalada. Abre esta página en
            Safari, toca <strong>Compartir</strong> y luego{' '}
            <strong>Añadir a pantalla de inicio</strong>. Ábrela desde ahí y vuelve a este
            botón.
          </p>
        </div>
      )}

      {estado === 'bloqueado' && (
        <p className="mb-3 rounded-2xl bg-danger-soft p-3.5 text-xs leading-relaxed text-danger">
          Bloqueaste las notificaciones para esta app. Hay que volver a permitirlas desde los
          ajustes del sistema; desde aquí ya no se puede pedir.
        </p>
      )}

      {estado === 'no-soportado' && (
        <p className="mb-3 text-xs text-content-subtle">
          Este navegador no soporta notificaciones push.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {estado === 'activo' ? (
            <Button onClick={desactivar} disabled={ocupado}>
              <BellOff size={15} aria-hidden />
              Desactivar en este dispositivo
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={activar}
              disabled={ocupado || estado === 'bloqueado' || estado === 'no-soportado'}
            >
              <Bell size={15} aria-hidden />
              {ocupado ? 'Activando…' : 'Activar avisos'}
            </Button>
          )}

          {estado === 'activo' && (
            <Button variant="outline" onClick={() => void avisoDePrueba()}>
              <Send size={15} aria-hidden />
              Probar
            </Button>
          )}
        </div>

        {estado === 'activo' && (
          <Field label="¿A qué hora te aviso?" hint="Hora de Colombia.">
            <Select
              value={String(settings.reminderHour)}
              onChange={(e) => update({ reminderHour: Number(e.target.value) })}
              className="max-w-[12rem]"
            >
              {HORAS.map((h) => (
                <option key={h} value={h}>
                  {horaLegible(h)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {mensaje && <p className="text-sm text-danger">{mensaje}</p>}

        <p className="text-[11px] leading-relaxed text-content-subtle">
          El permiso es por dispositivo: si quieres avisos también en el computador, actívalos
          allá.
        </p>
      </div>
    </Card>
  )
}
