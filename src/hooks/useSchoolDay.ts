import { useEffect, useMemo, useState } from 'react'
import { cycleInfoFor } from '../lib/cycle'
import { classesOnly, nowAndNext, resolveDay } from '../lib/school'
import { nowMinutes } from '../lib/dates'
import { useSchoolConfig, useSchoolSetup } from './useSchool'

/**
 * Todo lo del colegio para una fecha: día del ciclo, periodos resueltos con su
 * horario y materias. Es el punto de entrada único; ninguna pantalla debería
 * combinar `cycleInfoFor` y `resolveDay` por su cuenta.
 */
export function useSchoolDay(dateIso: string) {
  const { config } = useSchoolConfig()
  const { setup } = useSchoolSetup()

  const cycle = useMemo(() => cycleInfoFor(dateIso, config), [dateIso, config])
  const slots = useMemo(() => resolveDay(setup, cycle.cycleDay), [setup, cycle.cycleDay])
  const classes = useMemo(() => classesOnly(slots), [slots])

  return { cycle, slots, classes, setup }
}

/**
 * Clase en curso y siguiente, refrescadas cada minuto para que «Ahora mismo»
 * cambie solo al pasar de periodo.
 */
export function useNowAndNext(dateIso: string, isToday: boolean) {
  const { slots, cycle } = useSchoolDay(dateIso)
  const [minutes, setMinutes] = useState(() => nowMinutes())

  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => setMinutes(nowMinutes()), 60_000)
    return () => clearInterval(id)
  }, [isToday])

  return useMemo(
    () => ({ ...nowAndNext(slots, isToday ? minutes : 0), cycle, slots }),
    [slots, minutes, isToday, cycle],
  )
}
