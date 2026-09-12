import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isConfigured, supabase } from '../lib/supabase'
import { setUserIdOnAllStores } from './useStores'

export interface AuthState {
  session: Session | null
  /** true mientras averiguamos si hay sesión guardada: evita parpadeos al login. */
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, loading: isConfigured })

  useEffect(() => {
    if (!supabase) {
      setState({ session: null, loading: false })
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setUserIdOnAllStores(data.session?.user.id ?? null)
      setState({ session: data.session, loading: false })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserIdOnAllStores(session?.user.id ?? null)
      setState({ session, loading: false })
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return state
}

/** Mensajes de Supabase traducidos a algo que se entienda. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Tienes que confirmar el correo antes de entrar.'
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese correo. Inicia sesión.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('unable to validate email')) return 'Ese correo no parece válido.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un momento.'
  return message
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Falta configurar Supabase.'
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return error ? translateAuthError(error.message) : null
}

export async function signUp(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Falta configurar Supabase.'
  const { error } = await supabase.auth.signUp({ email: email.trim(), password })
  return error ? translateAuthError(error.message) : null
}

export async function resetPassword(email: string): Promise<string | null> {
  if (!supabase) return 'Falta configurar Supabase.'
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  })
  return error ? translateAuthError(error.message) : null
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}
