import { supabase } from './supabase'

// Login por CÓDIGO: el código de acceso es tu identidad en la nube y el bloqueo de entrada.
// El mismo código en cualquier dispositivo abre los mismos datos. Por debajo usamos
// email+contraseña de Supabase con un email DERIVADO del código (determinista, interno,
// sin envío de correos) y el código como contraseña. RLS protege por auth.uid().

const UNLOCK_KEY = 'mivida:unlocked'
export const MIN_CODE_LENGTH = 6

/** Email interno derivado del código (mismo código → mismo email → misma cuenta). */
export async function emailForCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(`mivida:${code.trim()}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `u${hex.slice(0, 40)}@mivida.local`
}

export interface AuthResult {
  ok: boolean
  error?: string
}

const CONFIRM_HINT =
  'Falta desactivar "Confirm email" en Supabase (Authentication → Providers → Email).'

/** Inicia sesión con el código; si la cuenta no existe todavía, la crea. */
export async function signInWithCode(code: string): Promise<AuthResult> {
  const clean = code.trim()
  if (clean.length < MIN_CODE_LENGTH) {
    return { ok: false, error: `El código debe tener al menos ${MIN_CODE_LENGTH} caracteres.` }
  }
  const email = await emailForCode(clean)
  const password = clean

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return { ok: true }

  // Credenciales inválidas para un email derivado ⇒ la cuenta aún no existe → crearla.
  if (/invalid login credentials/i.test(error.message)) {
    const { error: signUpErr } = await supabase.auth.signUp({ email, password })
    if (signUpErr) {
      return { ok: false, error: /confirm/i.test(signUpErr.message) ? CONFIRM_HINT : signUpErr.message }
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

/** El desbloqueo dura lo que dura la sesión del navegador (se pide el código al reabrir). */
export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === '1'
}
export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCK_KEY, '1')
}
export function lock(): void {
  sessionStorage.removeItem(UNLOCK_KEY)
}
