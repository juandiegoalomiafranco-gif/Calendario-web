import { addDays } from './dates'
import type { CalendarEvent } from '../hooks/useCalendarEvents'

/** Último día del evento (inclusivo). Un evento de un solo día termina el mismo día. */
export function ultimoDia(e: Pick<CalendarEvent, 'date' | 'endDate'>): string {
  return e.endDate && e.endDate > e.date ? e.endDate : e.date
}

/** ¿El evento ocupa ese día? Sirve para los de varios días, que salen en cada uno. */
export function ocurreEn(e: Pick<CalendarEvent, 'date' | 'endDate'>, dia: string): boolean {
  return e.date <= dia && dia <= ultimoDia(e)
}

/**
 * Tope de días al recorrer un evento. Un `fecha_fin` mal escrito o absurdo (un evento de
 * Google que «termina» dentro de diez años) haría miles de vueltas en cada pintado y
 * colgaría la pantalla; ningún evento real necesita más de un año.
 */
const MAX_DIAS_RECORRIDO = 366

/**
 * Los días de `desde` a `hasta` que toca el evento. Se recorta a la ventana pedida (la
 * rejilla del mes): un evento de Google puede durar meses y no hace falta recorrerlos todos.
 */
export function diasEnVentana(
  e: Pick<CalendarEvent, 'date' | 'endDate'>,
  desde: string,
  hasta: string,
): string[] {
  const dias: string[] = []
  const fin = ultimoDia(e) < hasta ? ultimoDia(e) : hasta
  for (let d = e.date > desde ? e.date : desde; d <= fin && dias.length < MAX_DIAS_RECORRIDO; d = addDays(d, 1)) {
    dias.push(d)
  }
  return dias
}

/**
 * Hora para mostrar en un día concreto: «18:30–19:30», «18:30» o nada (todo el día).
 * En los días intermedios de un evento largo la hora de inicio no aplica, así que no se muestra.
 */
export function rangoDeHoras(e: CalendarEvent, dia?: string): string | undefined {
  if (!e.time) return undefined
  if (dia && dia !== e.date) return undefined
  const mismoDia = !e.endDate || e.endDate <= e.date
  return e.endTime && mismoDia ? `${e.time}–${e.endTime}` : e.time
}

/** Enlace al correo del que salió un evento de Gmail (el servidor lo guarda en las notas). */
export function enlaceCorreo(e: CalendarEvent): string | undefined {
  if (e.source !== 'gmail') return undefined
  const enNotas = e.notes?.match(/https:\/\/mail\.google\.com\/\S+/)?.[0]
  if (enNotas) return enNotas
  return e.gmailMessageId
    ? `https://mail.google.com/mail/u/0/#all/${e.gmailMessageId}`
    : undefined
}
