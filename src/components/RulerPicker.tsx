import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { formatValue } from '../data/measurements'

const PX_PER_STEP = 14
const RULER_H = 72

interface RulerPickerProps {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
  decimals?: number
  /** Pasos entre etiquetas numéricas (default 10: cada 1 kg / 5 mm / 5 cm) */
  labelEvery?: number
  /** Pasos entre ticks altos (default labelEvery/2) */
  majorEvery?: number
  ariaLabel: string
}

function clampRound(v: number, min: number, max: number, step: number, decimals: number): number {
  const clamped = Math.min(max, Math.max(min, v))
  return Number((Math.round((clamped - min) / step) * step + min).toFixed(decimals))
}

export function RulerPicker({
  value,
  onChange,
  min,
  max,
  step,
  unit,
  decimals,
  labelEvery = 10,
  majorEvery,
  ariaLabel,
}: RulerPickerProps) {
  const dec = decimals ?? (step < 1 ? 1 : 0)
  const major = majorEvery ?? Math.max(1, Math.round(labelEvery / 2))
  const stepsCount = Math.round((max - min) / step)

  const scrollRef = useRef<HTMLDivElement>(null)
  const isProgRef = useRef(false)
  const userScrollingRef = useRef(false)
  const rafRef = useRef(0)
  const settleRef = useRef(0)
  const progTimerRef = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const scrollFor = (v: number) => ((v - min) / step) * PX_PER_STEP

  const scrollProgrammatic = (v: number, smooth: boolean) => {
    const el = scrollRef.current
    if (!el) return
    isProgRef.current = true
    window.clearTimeout(progTimerRef.current)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: scrollFor(v), behavior: smooth && !reduced ? 'smooth' : 'auto' })
    progTimerRef.current = window.setTimeout(() => {
      isProgRef.current = false
    }, 400)
  }

  // Posición inicial: sin animación
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = scrollFor(valueRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cambios externos de value (teclado / input directo ya scrollean por su cuenta,
  // esto cubre resets del padre) — nunca pelear contra un scroll del usuario
  useEffect(() => {
    const el = scrollRef.current
    if (!el || userScrollingRef.current) return
    const target = scrollFor(value)
    if (Math.abs(el.scrollLeft - target) > 1) scrollProgrammatic(value, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(settleRef.current)
      window.clearTimeout(progTimerRef.current)
    },
    [],
  )

  const handleScroll = () => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = scrollRef.current
      if (!el) return

      if (isProgRef.current) {
        if (Math.abs(el.scrollLeft - scrollFor(valueRef.current)) < 2) isProgRef.current = false
        return
      }

      userScrollingRef.current = true
      const idx = Math.min(stepsCount, Math.max(0, Math.round(el.scrollLeft / PX_PER_STEP)))
      const v = Number((min + idx * step).toFixed(dec))
      if (v !== valueRef.current) {
        valueRef.current = v
        if ('vibrate' in navigator) navigator.vibrate?.(3)
        onChange(v)
      }

      // Snap manual al soltar (más suave que CSS scroll-snap con cientos de puntos)
      window.clearTimeout(settleRef.current)
      settleRef.current = window.setTimeout(() => {
        userScrollingRef.current = false
        const target = scrollFor(valueRef.current)
        if (Math.abs(el.scrollLeft - target) > 1) scrollProgrammatic(valueRef.current, true)
      }, 140)
    })
  }

  const setValue = (v: number) => {
    const next = clampRound(v, min, max, step, dec)
    if (next !== valueRef.current) onChange(next)
    scrollProgrammatic(next, true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return
    const big = step * 10
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setValue(valueRef.current + step)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setValue(valueRef.current - step)
    else if (e.key === 'PageUp') setValue(valueRef.current + big)
    else if (e.key === 'PageDown') setValue(valueRef.current - big)
    else if (e.key === 'Home') setValue(min)
    else if (e.key === 'End') setValue(max)
    else return
    e.preventDefault()
  }

  const commitDraft = () => {
    const parsed = Number(draft.replace(',', '.'))
    setEditing(false)
    if (!Number.isNaN(parsed) && draft.trim() !== '') setValue(parsed)
  }

  // Regla SVG memoizada (~600 ticks máx: barato)
  const ruler = useMemo(() => {
    const width = stepsCount * PX_PER_STEP + 2
    const ticks = []
    for (let i = 0; i <= stepsCount; i++) {
      const x = i * PX_PER_STEP + 1
      const isLabel = i % labelEvery === 0
      const isMajor = isLabel || i % major === 0
      ticks.push(
        <line
          key={i}
          x1={x}
          y1={8}
          x2={x}
          y2={isMajor ? 30 : 20}
          stroke={isMajor ? '#4a4d55' : '#34363d'}
          strokeWidth={isLabel ? 2 : 1.5}
        />,
      )
      if (isLabel) {
        const v = min + i * step
        ticks.push(
          <text key={`t${i}`} x={x} y={52} textAnchor="middle" fontSize={12} fill="#8b8e98" className="tabular-nums">
            {Number(v.toFixed(dec)).toString().replace('.', ',')}
          </text>,
        )
      }
    }
    return (
      <svg width={width} height={RULER_H} className="block shrink-0">
        {ticks}
      </svg>
    )
  }, [stepsCount, labelEvery, major, min, step, dec])

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Valor grande centrado, estilo la referencia */}
      <div className="flex flex-col items-center">
        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDraft()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-40 bg-transparent text-center text-5xl font-bold text-ink-900 tabular-nums outline-none"
            aria-label={ariaLabel}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(value))
              setEditing(true)
            }}
            className="text-5xl font-bold text-ink-900 tabular-nums leading-none"
            aria-label={`${ariaLabel}: escribir valor directamente`}
          >
            {formatValue(value, dec)}
          </button>
        )}
        <span className="mt-1.5 h-1 w-12 rounded-full bg-brand-500" />
        <span className="mt-2 rounded-full bg-card border border-ink-200 text-xs font-semibold text-ink-600 px-3 py-1">
          {unit}
        </span>
      </div>

      {/* Regla deslizante */}
      <div className="relative w-full" style={{ height: RULER_H }}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${formatValue(value, dec)} ${unit}`}
          className="no-scrollbar h-full overflow-x-scroll overscroll-x-contain rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          style={{ touchAction: 'pan-x' }}
        >
          <div className="flex h-full items-start" style={{ paddingLeft: '50%', paddingRight: '50%' }}>
            {ruler}
          </div>
        </div>
        {/* Indicador central */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
          <span
            className="block border-x-[5px] border-t-[6px] border-x-transparent border-t-brand-500"
            style={{ width: 0, height: 0 }}
          />
          <span className="block w-0.5 bg-brand-500" style={{ height: 34 }} />
        </div>
      </div>
    </div>
  )
}
