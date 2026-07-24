import { useEffect, useState, type ReactNode } from 'react'
import { PinPad } from './PinPad'
import {
  PIN_LENGTH,
  hasPin,
  isUnlocked,
  markSetupSeen,
  markUnlocked,
  setPin,
  setupSeen,
  verifyPin,
} from '../lib/pin'

type Mode = 'locked' | 'create' | 'confirm' | 'open'

function initialMode(): Mode {
  if (hasPin()) return isUnlocked() ? 'open' : 'locked'
  return setupSeen() ? 'open' : 'create'
}

/** Envuelve la app: pantalla de bloqueo/creación de PIN antes de mostrar el contenido. */
export function PinGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [entry, setEntry] = useState('')
  const [first, setFirst] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (entry.length !== PIN_LENGTH) return

    if (mode === 'locked') {
      void verifyPin(entry).then((ok) => {
        if (ok) {
          markUnlocked()
          setMode('open')
        } else {
          setError('PIN incorrecto')
          setEntry('')
        }
      })
    } else if (mode === 'create') {
      setFirst(entry)
      setEntry('')
      setError(null)
      setMode('confirm')
    } else if (mode === 'confirm') {
      if (entry === first) {
        void setPin(entry).then(() => {
          markUnlocked()
          setMode('open')
        })
      } else {
        setError('No coincide, empieza de nuevo')
        setEntry('')
        setFirst('')
        setMode('create')
      }
    }
  }, [entry, mode, first])

  if (mode === 'open') return <>{children}</>

  const title =
    mode === 'locked' ? 'Ingresa tu PIN' : mode === 'create' ? 'Crea tu PIN' : 'Confírmalo'
  const subtitle =
    mode === 'locked'
      ? 'Desbloquea Mi Vida'
      : mode === 'create'
        ? 'Un código de 4 dígitos para proteger tus datos'
        : 'Escríbelo de nuevo'

  return (
    <div className="min-h-[100svh] bg-ink-50 flex flex-col items-center justify-center px-6 gap-10">
      <div className="text-center">
        <p className="text-4xl mb-2">🔒</p>
        <h1 className="text-2xl font-bold text-ink-900 font-display">{title}</h1>
        <p className="text-sm text-ink-500 mt-1">{subtitle}</p>
        {error && <p className="text-sm font-medium text-brand-600 mt-2">{error}</p>}
      </div>

      <PinPad
        value={entry}
        onChange={(v) => {
          setError(null)
          setEntry(v)
        }}
        length={PIN_LENGTH}
        error={!!error}
      />

      {mode === 'create' && (
        <button
          type="button"
          onClick={() => {
            markSetupSeen()
            setMode('open')
          }}
          className="text-sm text-ink-500 underline"
        >
          Configurar luego
        </button>
      )}
    </div>
  )
}
