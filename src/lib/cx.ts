/** Une clases ignorando falsos, para escribir condicionales sin ruido. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
