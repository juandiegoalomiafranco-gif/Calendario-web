import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Link2, Mail, RefreshCw, TriangleAlert } from 'lucide-react'
import { useGoogle, type GmailProcesado } from '../hooks/useGoogle'
import { cx } from '../lib/cx'
import { mensajeDeMotivo } from '../lib/google'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { Chip } from './ui/Chip'

/** «hace 5 min», «hace 2 h»… Para saber de un vistazo si la sincronización está viva. */
function haceCuanto(iso: string | null): string {
  if (!iso) return 'todavía no'
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000))
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`
}

/** Interruptor accesible; el área táctil es todo el botón, no solo la pastilla. */
function Interruptor({
  activo,
  onChange,
  etiqueta,
  disabled,
}: {
  activo: boolean
  onChange: (v: boolean) => void
  etiqueta: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={() => onChange(!activo)}
      className="grid min-h-[44px] min-w-[44px] shrink-0 place-items-center disabled:opacity-40"
    >
      <span
        className={cx(
          'flex h-6 w-10 items-center rounded-full p-0.5 transition-colors',
          activo ? 'bg-brand' : 'bg-surface-3',
        )}
      >
        <span
          className={cx(
            'h-5 w-5 rounded-full bg-surface shadow-sm transition-transform',
            activo && 'translate-x-4',
          )}
        />
      </span>
    </button>
  )
}

function FilaCorreo({ p }: { p: GmailProcesado }) {
  const esEvento = p.decision === 'evento'
  return (
    <li className="flex items-start gap-2.5 rounded-2xl border border-line p-3">
      <Mail size={15} className="mt-0.5 shrink-0 text-content-subtle" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content">
          {p.asunto || '(sin asunto)'}
        </p>
        {p.motivo && <p className="mt-0.5 line-clamp-2 text-xs text-content-muted">{p.motivo}</p>}
      </div>
      <Chip
        size="sm"
        className={
          esEvento
            ? 'bg-ok-soft text-ok'
            : p.decision === 'error'
              ? 'bg-danger-soft text-danger'
              : undefined
        }
      >
        {esEvento ? 'Evento' : p.decision === 'error' ? 'Error' : 'Descartado'}
      </Chip>
    </li>
  )
}

/** Cuenta de Google vinculada: calendario en los dos sentidos y eventos desde Gmail. */
export function GoogleSettings() {
  const g = useGoogle()
  const [params, setParams] = useSearchParams()
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  // Al volver de Google llega `?google=conectado|error&motivo=…` en la ruta. Se muestra
  // una vez y se limpia la URL para que recargar no repita el aviso.
  const resultado = params.get('google')
  const motivo = params.get('motivo')
  useEffect(() => {
    if (!resultado) return
    if (resultado === 'conectado') {
      setMensaje({ tipo: 'ok', texto: 'Google conectado. Estoy trayendo tus eventos.' })
    } else {
      // El motivo llega como código (`cancelado`, `no_permitido`…): se traduce.
      setMensaje({ tipo: 'error', texto: mensajeDeMotivo(motivo) })
    }
    const limpio = new URLSearchParams(params)
    limpio.delete('google')
    limpio.delete('motivo')
    setParams(limpio, { replace: true })
  }, [resultado, motivo, params, setParams])

  async function ejecutar(accion: () => Promise<{ ok: boolean; error?: string }>, exito?: string) {
    setOcupado(true)
    setMensaje(null)
    const r = await accion()
    if (!r.ok && r.error) setMensaje({ tipo: 'error', texto: r.error })
    else if (exito) setMensaje({ tipo: 'ok', texto: exito })
    setOcupado(false)
  }

  function pedirDesconexion() {
    const seguro = confirm(
      '¿Desconectar Google? Los eventos que vinieron de Google dejarán de verse en la app, pero siguen en Google Calendar. Lo que creaste aquí se queda.',
    )
    if (seguro) void ejecutar(g.desconectar, 'Google desconectado.')
  }

  const { conexion } = g
  const reconectar = conexion?.ultimoError === 'reconectar'
  const sinPermisoGmail = conexion != null && !conexion.scopes.some((s) => s.includes('gmail'))

  return (
    <Card>
      <CardHeader
        title="Google"
        icon={<CalendarDays size={16} className="text-content-subtle" aria-hidden />}
      />

      {mensaje && (
        <p
          role="status"
          className={cx(
            'mb-3 rounded-2xl p-3.5 text-xs leading-relaxed',
            mensaje.tipo === 'ok' ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger',
          )}
        >
          {mensaje.texto}
        </p>
      )}

      {!conexion && g.errorCarga ? (
        // Sin red al abrir no se sabe si hay conexión: mejor decirlo que dejar «Conectar» apagado.
        <div className="flex flex-col gap-3">
          <p className="text-sm text-content-muted">
            No se pudo leer el estado de Google. Revisa la conexión a internet.
          </p>
          <div>
            <Button disabled={ocupado} onClick={() => void ejecutar(async () => {
              await g.reintentar()
              return { ok: true }
            })}>
              <RefreshCw size={15} className={cx(ocupado && 'animate-spin')} aria-hidden />
              Reintentar
            </Button>
          </div>
        </div>
      ) : !conexion ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-content-muted">
            Conecta tu cuenta para ver tus eventos de Google Calendar aquí, subir los que
            crees en la app y detectar citas en tus correos importantes de Gmail.
          </p>
          <div>
            <Button
              variant="primary"
              disabled={ocupado || !g.cargado}
              onClick={() => void ejecutar(g.conectar)}
            >
              <Link2 size={15} aria-hidden />
              {ocupado ? 'Abriendo Google…' : 'Conectar con Google'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-surface-2 p-3.5">
            <p className="truncate text-sm font-semibold text-content">
              Conectado{conexion.email ? ` como ${conexion.email}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-content-muted">
              Última sincronización {haceCuanto(conexion.ultimaSync)}
            </p>
          </div>

          {reconectar && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-warn-soft p-3.5">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-warn">
                  Google pidió volver a dar permiso, así que la sincronización está en pausa.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-2"
                  disabled={ocupado}
                  onClick={() => void ejecutar(g.conectar)}
                >
                  Reconectar
                </Button>
              </div>
            </div>
          )}

          {conexion.calendarios.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-content-muted">
                Calendarios que se ven en la app
              </p>
              <ul className="flex flex-col">
                {conexion.calendarios.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-content">{c.nombre}</span>
                      {c.principal && (
                        <span className="block text-xs text-content-subtle">
                          Principal · aquí van los eventos que creas en la app
                        </span>
                      )}
                    </span>
                    <Interruptor
                      activo={c.visible}
                      etiqueta={`Mostrar ${c.nombre}`}
                      disabled={ocupado}
                      onChange={(v) => void ejecutar(() => g.setCalendarioVisible(c.id, v))}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-content">
                  Eventos importantes de Gmail
                </span>
                <span className="block text-xs leading-snug text-content-muted">
                  Solo correos que Gmail marca como importantes; Claude decide si hay un evento
                  y lo agrega solo.
                </span>
              </span>
              <Interruptor
                activo={conexion.gmailActivo && !sinPermisoGmail}
                etiqueta="Eventos importantes de Gmail"
                disabled={ocupado || sinPermisoGmail}
                onChange={(v) => void ejecutar(() => g.setGmailActivo(v))}
              />
            </div>
            {sinPermisoGmail && (
              <p className="mt-1 text-xs text-content-subtle">
                No diste permiso para leer Gmail. Reconecta y déjalo marcado para usarlo.
              </p>
            )}
          </div>

          {g.procesados.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-content-muted">Últimos correos revisados</p>
              <ul className="flex flex-col gap-2">
                {g.procesados.map((p) => (
                  <FilaCorreo key={p.messageId} p={p} />
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={ocupado}
              onClick={() => void ejecutar(g.sincronizarAhora, 'Sincronizado con Google.')}
            >
              <RefreshCw size={15} className={cx(ocupado && 'animate-spin')} aria-hidden />
              Sincronizar ahora
            </Button>
            <Button variant="ghost" disabled={ocupado} onClick={pedirDesconexion}>
              Desconectar
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
