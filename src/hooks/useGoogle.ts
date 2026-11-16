import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  llamarFuncion,
  mensajeDeError,
  recargarGoogle,
  useGoogleEstado,
} from '../lib/google'

export type { GoogleCalendario, GoogleConexion } from '../lib/google'

/** Resultado de una acción: `error` ya viene en español y listo para mostrar. */
export interface ResultadoGoogle {
  ok: boolean
  error?: string
}

/** Cuenta de Google vinculada: estado y acciones. */
export function useGoogle() {
  const { cargado, errorCarga, conexion } = useGoogleEstado()

  const conectar = useCallback(async (): Promise<ResultadoGoogle> => {
    const r = await llamarFuncion('google-auth', {
      accion: 'iniciar',
      volver_a: window.location.origin + window.location.pathname,
    })
    if (r.ok !== false && typeof r.url === 'string') {
      window.location.assign(r.url)
      return { ok: true }
    }
    return { ok: false, error: mensajeDeError(r.error, r.detalle) }
  }, [])

  /** La confirmación la pide quien llama (el botón), para poder explicar qué pasa. */
  const desconectar = useCallback(async (): Promise<ResultadoGoogle> => {
    const r = await llamarFuncion('google-auth', { accion: 'desconectar' })
    await recargarGoogle()
    return r.ok ? { ok: true } : { ok: false, error: mensajeDeError(r.error, r.detalle) }
  }, [])

  /** La sincronización automática es solo los lunes; este botón manda y trae al instante. */
  const sincronizarAhora = useCallback(async (): Promise<ResultadoGoogle> => {
    const r = await llamarFuncion('google-sync')
    await recargarGoogle()
    return r.ok ? { ok: true } : { ok: false, error: mensajeDeError(r.error, r.detalle) }
  }, [])

  /**
   * Cambia en la fila propia y pide una sync: el servidor ya lee de ahí. Es un cambio que
   * se hace a mano en Ajustes, como «Sincronizar ahora»: sin esta llamada, encender u
   * ocultar un calendario no se notaría hasta el lunes.
   */
  const actualizarFila = useCallback(
    async (cambios: Record<string, unknown>): Promise<ResultadoGoogle> => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user.id
      if (!uid) return { ok: false, error: 'No hay sesión iniciada.' }
      const { error } = await supabase
        .from('google_conexion')
        .update({ ...cambios, updated_at: new Date().toISOString() })
        .eq('user_id', uid)
      if (error) return { ok: false, error: 'No se pudo guardar el cambio.' }
      await recargarGoogle()
      void llamarFuncion('google-sync')
      return { ok: true }
    },
    [],
  )

  const setCalendarioVisible = useCallback(
    (id: string, visible: boolean) => {
      const calendarios = (conexion?.calendarios ?? []).map((c) =>
        c.id === id ? { ...c, visible } : c,
      )
      return actualizarFila({ calendarios })
    },
    [conexion, actualizarFila],
  )

  return {
    cargado,
    /** La última lectura del estado falló: Ajustes ofrece reintentar. */
    errorCarga,
    reintentar: recargarGoogle,
    conexion,
    conectado: conexion != null,
    conectar,
    desconectar,
    sincronizarAhora,
    setCalendarioVisible,
  }
}
