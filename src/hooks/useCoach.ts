import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { newId } from '../lib/cloudStore'
import type { Session, SessionType } from '../data/types'

/**
 * Puente con la app del entrenador.
 *
 * La idea: Juan Diego genera un «código de atleta» y se lo pasa a su amigo. La app
 * del amigo publica el plan de la semana en la tabla `coach_plans` usando ese código,
 * y esta app lo lee. El código es una credencial de capacidad: con él SOLO se puede
 * publicar, nunca leer. Quien no sea el dueño no puede ver ni un plan.
 *
 * La resolución del código a usuario vive en un trigger `SECURITY DEFINER` de
 * Postgres, no en una función expuesta por REST: si estuviera expuesta, cualquiera
 * con la publishable key podría probar códigos y saber cuáles existen.
 *
 * Ver docs/PUENTE-ENTRENADOR.md para lo que tiene que añadir el amigo en su app.
 */

/** Una sesión tal como la publica el entrenador. */
export interface CoachSession {
  titulo: string
  tipo: SessionType
  resumen?: string
  distanciaKm?: string
  estructura?: string[]
}

export interface CoachDay {
  fecha: string // YYYY-MM-DD
  sesiones: CoachSession[]
  nota?: string
}

export interface CoachPlanPayload {
  dias: CoachDay[]
}

export interface CoachPlan {
  id: string
  coachName?: string
  weekStart?: string
  createdAt: string
  payload: CoachPlanPayload
}

const TIPOS: SessionType[] = [
  'crossfit',
  'running-easy',
  'running-long',
  'running-shakeout',
  'running-goal',
  'swim-technique',
  'swim-endurance',
  'flex',
  'rest',
]

function tipoValido(t: unknown): SessionType {
  return TIPOS.includes(t as SessionType) ? (t as SessionType) : 'crossfit'
}

/** El plan del entrenador, en el formato de sesiones que ya usa el resto de la app. */
export function coachSessionsToSessions(day: CoachDay): Session[] {
  return day.sesiones.map((s, i) => ({
    id: `coach-${day.fecha}-${i}`,
    slot: 'ALL' as const,
    type: tipoValido(s.tipo),
    title: s.titulo,
    summary: s.resumen ?? '',
    distanceKm: s.distanciaKm,
    structure: s.estructura,
    why: 'Lo mandó tu entrenador.',
  }))
}

const CODE_CACHE = 'mivida:athlete-code'
const PLAN_CACHE = 'mivida:coach-plans'

function leerCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** Código de atleta: largo y aleatorio, porque quien lo tenga puede publicar planes. */
function nuevoCodigo(): string {
  return `atleta-${newId()}`
}

export function useCoach() {
  const [code, setCode] = useState<string | null>(() => leerCache<string | null>(CODE_CACHE, null))
  const [plans, setPlans] = useState<CoachPlan[]>(() => leerCache<CoachPlan[]>(PLAN_CACHE, []))
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const { data: sesion } = await supabase.auth.getSession()
    if (!sesion.session) return
    setCargando(true)
    try {
      const [{ data: codeRow }, { data: planRows, error: planErr }] = await Promise.all([
        supabase.from('athlete_codes').select('code').maybeSingle(),
        supabase
          .from('coach_plans')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      if (codeRow?.code) {
        setCode(codeRow.code)
        localStorage.setItem(CODE_CACHE, JSON.stringify(codeRow.code))
      }
      if (planErr) {
        setError(planErr.message)
        return
      }
      const parsed: CoachPlan[] = (planRows ?? []).map((r) => ({
        id: r.id as string,
        coachName: (r.coach_name as string | null) ?? undefined,
        weekStart: (r.week_start as string | null) ?? undefined,
        createdAt: r.created_at as string,
        payload: (r.payload as CoachPlanPayload) ?? { dias: [] },
      }))
      setPlans(parsed)
      localStorage.setItem(PLAN_CACHE, JSON.stringify(parsed))
      setError(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  /** Crea el código la primera vez (o lo rota si el amigo ya no debería publicar). */
  const generarCodigo = useCallback(async () => {
    const { data: sesion } = await supabase.auth.getSession()
    const userId = sesion.session?.user.id
    if (!userId) {
      setError('Entra con tu código para poder generar el del entrenador.')
      return
    }
    const nuevo = nuevoCodigo()
    const { error: err } = await supabase
      .from('athlete_codes')
      .upsert({ user_id: userId, code: nuevo }, { onConflict: 'user_id' })
    if (err) {
      setError(err.message)
      return
    }
    setCode(nuevo)
    localStorage.setItem(CODE_CACHE, JSON.stringify(nuevo))
    setError(null)
  }, [])

  /**
   * Pegar el plan a mano. El puente depende de que el amigo cambie su app; esto
   * evita quedarse colgado mientras tanto.
   */
  const importarPegado = useCallback(
    async (texto: string) => {
      const { data: sesion } = await supabase.auth.getSession()
      if (!sesion.session || !code) {
        setError('Primero genera tu código de atleta.')
        return false
      }
      let payload: CoachPlanPayload
      try {
        payload = JSON.parse(texto) as CoachPlanPayload
      } catch {
        setError('Eso no es un JSON válido. Pide que te lo manden tal cual sale de la app.')
        return false
      }
      if (!Array.isArray(payload?.dias)) {
        setError('Al JSON le falta la lista «dias».')
        return false
      }
      const { error: err } = await supabase
        .from('coach_plans')
        .insert({ athlete_code: code, coach_name: 'Pegado a mano', payload })
      if (err) {
        setError(err.message)
        return false
      }
      await cargar()
      return true
    },
    [code, cargar],
  )

  /** Las sesiones que mandó el entrenador para esa fecha, si mandó alguna. */
  const sesionesDe = useCallback(
    (fecha: string): Session[] | null => {
      for (const plan of plans) {
        const dia = plan.payload.dias?.find((d) => d.fecha === fecha)
        if (dia) return coachSessionsToSessions(dia)
      }
      return null
    },
    [plans],
  )

  return { code, plans, cargando, error, generarCodigo, importarPegado, sesionesDe, recargar: cargar }
}
