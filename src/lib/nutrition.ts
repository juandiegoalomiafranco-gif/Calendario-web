import type { Session, SessionType } from '../data/types'
import type { ScenarioCode } from '../data/nutrition'

const isLongRun = (t: SessionType) => t === 'running-long' || t === 'running-goal'
const isSwim = (t: SessionType) => t === 'swim-technique' || t === 'swim-endurance'
const isGymFunctional = (t: SessionType) => t === 'crossfit'

/**
 * Elige el escenario de dieta según la carga de entreno del día (la "lógica" que conecta
 * comida y ejercicio). Es una sugerencia; el usuario puede sobreescribirla.
 *  - Fondo largo (running-long/goal) → E3 (comer para rendir)
 *  - Doble sesión, o gym + natación   → E2
 *  - Gym/funcional, rodaje suave o flex→ E1
 *  - Solo descanso                    → E4 (aquí vive el déficit)
 */
export function scenarioForDay(sessions: Session[]): ScenarioCode {
  const types = sessions.map((s) => s.type)
  const active = types.filter((t) => t !== 'rest')
  if (active.length === 0) return 'E4'
  if (types.some(isLongRun)) return 'E3'
  const hasGym = types.some(isGymFunctional)
  const hasSwim = types.some(isSwim)
  if ((hasGym && hasSwim) || active.length >= 2) return 'E2'
  return 'E1'
}
