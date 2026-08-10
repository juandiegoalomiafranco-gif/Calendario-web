/**
 * Fusión de lo guardado en el dispositivo con lo que hay en la nube.
 *
 * Antes la nube reemplazaba la caché local, así que un entrenamiento registrado
 * sin conexión desaparecía en cuanto el servidor respondía. Aquí gana la marca
 * de tiempo más alta, y se devuelve qué claves hay que subir.
 */
export interface Stamped {
  updatedAt?: string
}

export interface MergeResult<T> {
  merged: Record<string, T>
  /** Claves cuya versión local es más nueva: hay que subirlas. */
  pending: string[]
}

export function mergeByUpdatedAt<T extends Stamped>(
  local: Record<string, T>,
  cloud: Record<string, T>,
): MergeResult<T> {
  const merged: Record<string, T> = { ...cloud }
  const pending: string[] = []

  for (const [key, localValue] of Object.entries(local)) {
    const cloudValue = cloud[key]
    if (!cloudValue || (localValue.updatedAt ?? '') > (cloudValue.updatedAt ?? '')) {
      merged[key] = localValue
      pending.push(key)
    }
  }

  return { merged, pending }
}
