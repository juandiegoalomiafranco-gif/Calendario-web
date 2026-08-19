import { createClient } from 'jsr:@supabase/supabase-js@2'
import { enviarPush, type PushSubscription, type VapidKeys } from './webpush.ts'

/**
 * Aviso diario de lo que viene mañana.
 *
 * La tarea de pg_cron la llama cada hora; cada usuario recibe el aviso solo en la
 * hora que escogió, medida en Colombia. Hacerlo por hora en vez de una vez al día
 * es lo que permite que la hora sea configurable sin tocar el cron.
 *
 * De paso, esta llamada diaria mantiene el proyecto con actividad: el plan gratuito
 * de Supabase pausa los que llevan días quietos, y eso ya dejó la app sin nube una
 * vez.
 */

const TZ = 'America/Bogota'

/** Fecha de hoy en Colombia, en ISO. */
function hoyEnColombia(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function horaEnColombia(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(now),
  )
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

const ETIQUETA: Record<string, string> = {
  examen: 'Examen',
  quiz: 'Quiz',
  entrega: 'Entrega',
  tarea: 'Tarea',
}

interface TaskRow {
  title: string
  kind: string | null
  scope: string | null
  urgency: string | null
}

interface EventRow {
  title: string | null
}

/** Arma el texto del aviso. Devuelve null si no hay nada que decir. */
function componerAviso(tareas: TaskRow[], eventos: EventRow[], vencidas: number) {
  if (tareas.length === 0 && eventos.length === 0 && vencidas === 0) return null

  const partes: string[] = []

  // Lo que más pesa primero: exámenes y entregas antes que tareas sueltas.
  const orden = ['examen', 'entrega', 'quiz', 'tarea']
  const ordenadas = [...tareas].sort(
    (a, b) => orden.indexOf(a.kind ?? 'tarea') - orden.indexOf(b.kind ?? 'tarea'),
  )

  for (const t of ordenadas.slice(0, 3)) {
    const etiqueta = t.scope === 'personal' ? 'Personal' : (ETIQUETA[t.kind ?? 'tarea'] ?? 'Tarea')
    partes.push(`${etiqueta}: ${t.title}`)
  }
  if (ordenadas.length > 3) partes.push(`y ${ordenadas.length - 3} más`)

  for (const e of eventos.slice(0, 2)) if (e.title) partes.push(e.title)

  if (vencidas > 0) partes.push(`${vencidas} vencida${vencidas === 1 ? '' : 's'}`)

  const total = tareas.length + eventos.length
  const title =
    total === 0 ? 'Tienes cosas vencidas' : total === 1 ? 'Mañana tienes 1 cosa' : `Mañana tienes ${total} cosas`

  return { title, body: partes.join(' · ') }
}

/**
 * Comparación en tiempo constante: comparar tokens con `===` filtra información por
 * el tiempo que tarda en fallar.
 */
function tokenIgual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return dif === 0
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // `?forzar=1` manda el aviso sin mirar la hora: sirve para probarlo a mano.
  const forzar = new URL(req.url).searchParams.get('forzar') === '1'
  const hoy = hoyEnColombia()
  const manana = sumarDias(hoy, 1)
  const hora = horaEnColombia()

  const { data: secretos, error: secretoErr } = await supabase
    .from('app_secrets')
    .select('name, value')
    .in('name', ['vapid', 'cron_token'])

  if (secretoErr || !secretos) {
    return Response.json({ error: 'No se pudieron leer los secretos.' }, { status: 500 })
  }

  /*
   * Autenticación propia. La función corre con verify_jwt desactivado porque quien la
   * llama es pg_cron desde la propia base, y desde ahí no hay un JWT de usuario que
   * mandar; usar la service role key en el cron significaría dejarla escrita en la
   * definición de la tarea. En su lugar comparte un token aleatorio con la base.
   */
  const tokenEsperado = (secretos.find((s) => s.name === 'cron_token')?.value as { token?: string })
    ?.token
  const tokenRecibido = req.headers.get('x-cron-token') ?? ''
  if (!tokenEsperado || !tokenIgual(tokenRecibido, tokenEsperado)) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const vapid = secretos.find((s) => s.name === 'vapid')?.value
  if (!vapid) {
    return Response.json({ error: 'Faltan las claves VAPID en app_secrets.' }, { status: 500 })
  }
  const keys = vapid as VapidKeys

  let query = supabase.from('settings').select('user_id, reminder_hour').eq('reminders_on', true)
  if (!forzar) query = query.eq('reminder_hour', hora)
  const { data: usuarios, error: usuariosErr } = await query

  if (usuariosErr) return Response.json({ error: usuariosErr.message }, { status: 500 })

  const resumen: Record<string, unknown>[] = []

  for (const u of usuarios ?? []) {
    const userId = u.user_id as string

    const [{ data: tareas }, { data: eventos }, { data: atrasadas }, { data: subs }] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('title, kind, scope, urgency')
          .eq('user_id', userId)
          .eq('done', false)
          .is('deleted_at', null)
          .eq('due_date', manana),
        supabase
          .from('calendar_events')
          .select('title')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .eq('important', true)
          .eq('date', manana),
        supabase
          .from('tasks')
          .select('id')
          .eq('user_id', userId)
          .eq('done', false)
          .is('deleted_at', null)
          .lt('due_date', hoy),
        supabase.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', userId),
      ])

    const aviso = componerAviso(tareas ?? [], eventos ?? [], (atrasadas ?? []).length)
    if (!aviso || (subs ?? []).length === 0) {
      resumen.push({ userId, enviado: 0, motivo: aviso ? 'sin dispositivos' : 'nada que avisar' })
      continue
    }

    const payload = JSON.stringify({ ...aviso, tag: 'recordatorio', url: '/#/pendientes' })

    let enviados = 0
    for (const s of subs ?? []) {
      const sub = s as PushSubscription
      try {
        const r = await enviarPush(sub, payload, keys)
        if (r.ok) enviados++
        // Una suscripción muerta no se reintenta nunca más: se borra.
        if (r.caducada) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      } catch (e) {
        console.error('Fallo enviando push:', e instanceof Error ? e.message : e)
      }
    }
    resumen.push({ userId, enviado: enviados })
  }

  return Response.json({ hoy, manana, hora, forzar, resumen })
})
