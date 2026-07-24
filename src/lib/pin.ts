// PIN de entrada: bloqueo LOCAL de pantalla. Guarda un hash SHA-256 del código en
// localStorage. Importante: NO cifra los datos en la nube; la protección real de datos
// la da RLS por `auth.uid()` en Supabase. Es una barrera para abrir la app en el
// dispositivo (proteger finanzas/salud a la vista), tal como pidió Juan Diego.

const PIN_HASH_KEY = 'mivida:pin:v1'
const SETUP_SEEN_KEY = 'mivida:pin-setup-seen:v1'
const UNLOCK_KEY = 'mivida:unlocked'

export const PIN_LENGTH = 4

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hasPin(): boolean {
  return !!localStorage.getItem(PIN_HASH_KEY)
}

/** True si ya se mostró (y resolvió) la pantalla inicial de configuración del PIN. */
export function setupSeen(): boolean {
  return !!localStorage.getItem(SETUP_SEEN_KEY)
}

export function markSetupSeen(): void {
  localStorage.setItem(SETUP_SEEN_KEY, '1')
}

export async function setPin(pin: string): Promise<void> {
  localStorage.setItem(PIN_HASH_KEY, await sha256Hex(pin))
  markSetupSeen()
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY)
  if (!stored) return true
  return stored === (await sha256Hex(pin))
}

export function clearPin(): void {
  localStorage.removeItem(PIN_HASH_KEY)
  sessionStorage.removeItem(UNLOCK_KEY)
}

/** El desbloqueo dura lo que dura la sesión del navegador (se pide de nuevo al reabrir). */
export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === '1'
}

export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCK_KEY, '1')
}
