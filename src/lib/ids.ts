/**
 * UUID estable derivado de un texto.
 *
 * Hace falta cuando los dos dispositivos crean por su cuenta la misma fila: el
 * calendario del colegio se siembra en cada uno, y el registro de entreno tiene
 * una fila por sesión del plan. Con ids aleatorios el celular y el computador
 * generarían dos copias de cada cosa; derivándolos del contenido, ambos llegan
 * al mismo id y el upsert las une.
 *
 * No es criptográfico ni pretende serlo: son cuatro FNV-1a con semillas
 * distintas, suficiente para unos cientos de filas propias.
 */
export function stableId(namespace: string, ...parts: string[]): string {
  const src = `${namespace}|${parts.join('|')}`
  const hex = [0x811c9dc5, 0x01000193, 0x7f4a7c15, 0x9e3779b9]
    .map((seed) => {
      let h = seed >>> 0
      for (let i = 0; i < src.length; i++) {
        h ^= src.charCodeAt(i)
        h = Math.imul(h, 0x01000193) >>> 0
      }
      return h.toString(16).padStart(8, '0')
    })
    .join('')

  // Forma de UUID v4 para que Postgres lo acepte en una columna `uuid`.
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-')
}
