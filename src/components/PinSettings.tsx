import { useEffect, useState } from 'react'
import { PinPad } from './PinPad'
import { PIN_LENGTH, clearPin, hasPin, setPin } from '../lib/pin'

/** Tarjeta de Ajustes para activar, cambiar o quitar el PIN de entrada. */
export function PinSettings() {
  const [enabled, setEnabled] = useState(hasPin())
  const [step, setStep] = useState<null | 'create' | 'confirm'>(null)
  const [entry, setEntry] = useState('')
  const [first, setFirst] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  function announce(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2000)
  }

  useEffect(() => {
    if (entry.length !== PIN_LENGTH || !step) return

    if (step === 'create') {
      setFirst(entry)
      setEntry('')
      setError(null)
      setStep('confirm')
    } else {
      if (entry === first) {
        void setPin(entry).then(() => {
          setEnabled(true)
          setStep(null)
          setEntry('')
          setFirst('')
          announce('PIN activado')
        })
      } else {
        setError('No coincide')
        setEntry('')
        setFirst('')
        setStep('create')
      }
    }
  }, [entry, step, first])

  function startCreate() {
    setStep('create')
    setEntry('')
    setFirst('')
    setError(null)
  }
  function cancel() {
    setStep(null)
    setEntry('')
    setFirst('')
    setError(null)
  }
  function remove() {
    clearPin()
    setEnabled(false)
    announce('PIN quitado')
  }

  return (
    <div className="rounded-3xl bg-card shadow-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">PIN de entrada</p>
          <p className="text-xs text-ink-500">
            {enabled ? 'Activado — se pide al abrir la app' : 'Bloqueo local para proteger tus datos'}
          </p>
        </div>
        {!step &&
          (enabled ? (
            <button onClick={remove} className="text-sm font-medium text-brand-600">
              Quitar
            </button>
          ) : (
            <button
              onClick={startCreate}
              className="rounded-full bg-brand-500 text-white text-sm font-semibold px-4 py-2 active:bg-brand-600"
            >
              Activar
            </button>
          ))}
      </div>

      {enabled && !step && (
        <button onClick={startCreate} className="self-start text-sm font-medium text-ink-500 underline">
          Cambiar PIN
        </button>
      )}

      {step && (
        <div className="flex flex-col items-center gap-5 pt-1">
          <p className="text-sm text-ink-500">
            {step === 'create' ? 'Escribe un PIN de 4 dígitos' : 'Confírmalo'}
          </p>
          {error && <p className="text-sm font-medium text-brand-600">{error}</p>}
          <PinPad
            value={entry}
            onChange={(v) => {
              setError(null)
              setEntry(v)
            }}
            length={PIN_LENGTH}
            error={!!error}
          />
          <button onClick={cancel} className="text-sm text-ink-500 underline">
            Cancelar
          </button>
        </div>
      )}

      {flash && <p className="text-sm font-medium text-ok-600">{flash}</p>}
      <p className="text-[11px] text-ink-400">
        El PIN es un bloqueo local del dispositivo; no cifra los datos en la nube.
      </p>
    </div>
  )
}
