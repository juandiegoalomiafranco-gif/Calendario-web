import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Quién llama a una función de Google.
 *
 * Las funciones corren con verify_jwt desactivado porque las llama también pg_cron, que
 * no tiene un JWT de usuario que mandar (y poner la service role key en la definición
 * de la tarea sería dejarla escrita en la base). Así que cada función valida a mano:
 * o trae el token del cron (y entonces actúa sobre todos los usuarios conectados), o
 * trae el JWT de un usuario (y entonces actúa solo sobre ese usuario).
 */

export type Admin = SupabaseClient

export type Quien = { tipo: 'cron' } | { tipo: 'usuario'; userId: string }

/** Cliente con la service role: salta RLS y es el único que puede leer los tokens. */
export function crearAdmin(): Admin {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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

async function esCron(req: Request, admin: Admin): Promise<boolean> {
  const recibido = req.headers.get('x-cron-token')
  if (!recibido) return false
  const { data, error } = await admin
    .from('app_secrets')
    .select('value')
    .eq('name', 'cron_token')
    .maybeSingle()
  if (error || !data) return false
  const esperado = (data.value as { token?: string } | null)?.token
  return !!esperado && tokenIgual(recibido, esperado)
}

/** El usuario dueño del JWT, comprobado contra Supabase Auth (no basta con decodificarlo). */
export async function usuarioDelJwt(req: Request, admin: Admin): Promise<string | null> {
  const cabecera = req.headers.get('Authorization') ?? ''
  const jwt = cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : ''
  if (!jwt) return null
  try {
    const { data, error } = await admin.auth.getUser(jwt)
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}

/**
 * Cron o usuario. Si llega una cabecera de cron, solo se acepta como cron: un token de
 * cron equivocado no cae al JWT, para que un fallo de configuración se vea como tal.
 */
export async function identificar(req: Request, admin: Admin): Promise<Quien | null> {
  if (req.headers.get('x-cron-token')) {
    return (await esCron(req, admin)) ? { tipo: 'cron' } : null
  }
  const userId = await usuarioDelJwt(req, admin)
  return userId ? { tipo: 'usuario', userId } : null
}
