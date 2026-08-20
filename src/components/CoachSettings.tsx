import { useState } from 'react'
import { Check, ClipboardPaste, Copy, Dumbbell, RefreshCw } from 'lucide-react'
import { useCoach } from '../hooks/useCoach'
import { formatDayMonth } from '../lib/dates'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { Field, TextArea } from './ui/Field'

/** Código de atleta, planes recibidos y la opción de pegar uno a mano. */
export function CoachSettings() {
  const { code, plans, error, generarCodigo, importarPegado, recargar } = useCoach()
  const [copiado, setCopiado] = useState(false)
  const [pegando, setPegando] = useState(false)
  const [texto, setTexto] = useState('')

  async function copiar() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  return (
    <Card>
      <CardHeader
        title="Entrenador"
        icon={<Dumbbell size={16} className="text-content-subtle" aria-hidden />}
        action={
          <Button variant="ghost" size="icon-sm" onClick={recargar} aria-label="Buscar planes nuevos">
            <RefreshCw size={14} aria-hidden />
          </Button>
        }
      />

      <p className="mb-3 text-sm text-content-muted">
        Tu amigo publica el entrenamiento desde su app con este código y aquí aparece solo.
        Con el código únicamente se puede <strong className="text-content">enviarte</strong> planes:
        nadie puede leer los tuyos.
      </p>

      {code ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-2xl bg-surface-2 px-3 py-2.5 text-[13px] tabular text-content">
            {code}
          </code>
          <Button onClick={copiar}>
            {copiado ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            {copiado ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      ) : (
        <Button variant="primary" onClick={generarCodigo} className="mb-3">
          Generar mi código de atleta
        </Button>
      )}

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {plans.length > 0 ? (
        <div className="mb-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-content-muted">Planes recibidos</p>
          {plans.slice(0, 4).map((p) => (
            <div key={p.id} className="rounded-2xl border border-line px-3 py-2">
              <p className="text-sm font-semibold text-content">
                {p.coachName || 'Tu entrenador'}
                {p.weekStart ? ` · semana del ${formatDayMonth(p.weekStart)}` : ''}
              </p>
              <p className="text-xs text-content-subtle">
                {p.payload.dias?.length ?? 0} días · recibido el{' '}
                {formatDayMonth(p.createdAt.slice(0, 10))}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-xs text-content-subtle">
          Todavía no ha llegado ningún plan.
        </p>
      )}

      {pegando ? (
        <div className="flex flex-col gap-2">
          <Field
            label="Pega el plan"
            hint="El JSON tal cual te lo manda. Sirve mientras tu amigo conecta su app."
          >
            <TextArea
              rows={5}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder='{"dias":[{"fecha":"2026-08-20","sesiones":[{"titulo":"Fuerza","tipo":"crossfit"}]}]}'
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={async () => {
                if (await importarPegado(texto)) {
                  setTexto('')
                  setPegando(false)
                }
              }}
            >
              Importar
            </Button>
            <Button variant="ghost" onClick={() => setPegando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setPegando(true)}>
          <ClipboardPaste size={15} aria-hidden />
          Pegar un plan a mano
        </Button>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-content-subtle">
        Las instrucciones exactas para tu amigo están en{' '}
        <code className="text-content-muted">docs/PUENTE-ENTRENADOR.md</code> del repositorio.
        Son unas 20 líneas de su lado.
      </p>
    </Card>
  )
}
