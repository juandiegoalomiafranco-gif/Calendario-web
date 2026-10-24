import { supabase } from './supabase'

/**
 * Login por CÓDIGO. El código es a la vez la identidad en la nube y el bloqueo de
 * entrada: el mismo código, escrito en el celular y en el computador, abre los mismos
 * datos. Por debajo usamos email+contraseña de Supabase con un email DERIVADO del
 * código (determinista, interno, sin enviar correos) y el código como contraseña.
 * RLS protege por auth.uid().
 *
 * Sustituye a la sesión anónima, que creaba una cuenta distinta en cada dispositivo
 * y por tanto nunca podía sincronizar nada entre ellos.
 */

const UNLOCK_KEY = 'mivida:unlocked'
export const MIN_CODE_LENGTH = 4

async function sha256(texto: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
  return new Uint8Array(digest)
}

/** Email interno derivado del código (mismo código → mismo email → misma cuenta). */
export async function emailForCode(code: string): Promise<string> {
  const bytes = await sha256(`mivida:${code.trim()}`)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `u${hex.slice(0, 40)}@mivida.local`
}

/**
 * Contraseña derivada del código, no el código en crudo.
 *
 * Dos razones. Supabase exige una longitud mínima de contraseña (6 por defecto), así
 * que un código corto haría fallar el registro con un error que no dice nada útil;
 * el hash siempre mide 43 caracteres y ese problema desaparece. Y el código tal cual
 * nunca sale del dispositivo.
 *
 * Ojo: esto no añade seguridad frente a alguien que adivine el código — la fortaleza
 * sigue siendo la del código que escribes.
 */
async function passwordForCode(code: string): Promise<string> {
  const bytes = await sha256(`mivida:pw:${code.trim()}`)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface AuthResult {
  ok: boolean
  error?: string
}

const CONFIRM_HINT =
  'Falta desactivar «Confirm email» en Supabase (Authentication → Providers → Email).'

/** Inicia sesión con el código; si la cuenta no existe todavía, la crea. */
export async function signInWithCode(code: string): Promise<AuthResult> {
  const clean = code.trim()
  if (clean.length < MIN_CODE_LENGTH) {
    return { ok: false, error: `El código debe tener al menos ${MIN_CODE_LENGTH} caracteres.` }
  }
  const email = await emailForCode(clean)
  const password = await passwordForCode(clean)

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return { ok: true }

  // Credenciales inválidas para un email derivado ⇒ la cuenta aún no existe → crearla.
  if (/invalid login credentials/i.test(error.message)) {
    const { error: signUpErr } = await supabase.auth.signUp({ email, password })
    if (signUpErr) {
      return {
        ok: false,
        error: /confirm/i.test(signUpErr.message) ? CONFIRM_HINT : signUpErr.message,
      }
    }
    const { data } = await supabase.auth.getSession()
    if (data.session) return { ok: true }
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password })
    if (e2) return { ok: false, error: /confirm/i.test(e2.message) ? CONFIRM_HINT : e2.message }
    return { ok: true }
  }

  if (/email not confirmed|confirm/i.test(error.message)) return { ok: false, error: CONFIRM_HINT }
  return { ok: false, error: error.message }
}

export async function signOut(): Promise<void> {
  lock()
  await supabase.auth.signOut()
}

export async function hasSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

/**
 * El desbloqueo se recuerda en ESTE dispositivo hasta cerrar sesión.
 *
 * Antes vivía en `sessionStorage`, y el iPhone lo vacía cada vez que se cierra la app
 * instalada: pedía el código en cada apertura aunque la sesión de la nube siguiera
 * abierta. Ahora manda la sesión de Supabase (que ya persiste en `localStorage`); esta
 * marca queda de respaldo para entrar sin red.
 */
export function isUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}
export function markUnlocked(): void {
  try {
    localStorage.setItem(UNLOCK_KEY, '1')
  } catch {
    // Sin almacenamiento (modo privado) solo se pierde el recuerdo, no la sesión.
  }
}
export function lock(): void {
  try {
    localStorage.removeItem(UNLOCK_KEY)
    // Restos de la versión anterior, que guardaba la marca por pestaña.
    sessionStorage.removeItem(UNLOCK_KEY)
  } catch {
    // Igual que arriba: nada que limpiar si no hay almacenamiento.
  }
}
