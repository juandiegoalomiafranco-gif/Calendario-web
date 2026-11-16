/**
 * Respuestas JSON y CORS comunes a las funciones de Google.
 *
 * La app llama a estas funciones desde el navegador (`supabase.functions.invoke`), así
 * que cada respuesta tiene que llevar las cabeceras CORS, también las de error: si no,
 * el navegador se come el cuerpo y la app solo ve un «Failed to fetch».
 */

const PRODUCCION = 'https://calendario-web-ten.vercel.app'

/*
 * Las vistas previas de Vercel llevan el sufijo del equipo
 * (`calendario-<hash>-juandiegoalomiafranco-2991s-projects.vercel.app` y
 * `calendario-web-git-<rama>-…`). Ese sufijo solo lo puede usar el equipo, así que
 * exigirlo basta para que `volver_a` no sirva para mandar a nadie a otro sitio.
 */
const VISTA_PREVIA =
  /^https:\/\/calendario(-web)?-[a-z0-9-]+-juandiegoalomiafranco-2991s-projects\.vercel\.app$/

const LOCALES = new Set(['http://localhost:5173'])

export const VOLVER_POR_DEFECTO = `${PRODUCCION}/`

export function origenPermitido(origen: string | null): boolean {
  if (!origen) return false
  return origen === PRODUCCION || LOCALES.has(origen) || VISTA_PREVIA.test(origen)
}

/**
 * La URL a la que se vuelve después de Google, ya limpia (origen + ruta), o null si no
 * es de la app. Se descartan query y hash: la vuelta se arma con `#/ajustes?...` porque
 * la app usa HashRouter.
 */
export function volverAValido(valor: unknown): string | null {
  if (typeof valor !== 'string' || valor.length > 500) return null
  let url: URL
  try {
    url = new URL(valor)
  } catch {
    return null
  }
  if (!origenPermitido(url.origin)) return null
  return url.origin + url.pathname
}

export function cabecerasCors(req: Request): Record<string, string> {
  const origen = req.headers.get('Origin')
  const cabeceras: Record<string, string> = { Vary: 'Origin' }
  if (origen && origenPermitido(origen)) {
    // Se devuelven las cabeceras que pide el navegador: si supabase-js añade una nueva en
    // una versión futura, la llamada no se rompe por CORS.
    const pedidas = (req.headers.get('Access-Control-Request-Headers') ?? '').replace(/[^\w\-, ]/g, '')
    cabeceras['Access-Control-Allow-Origin'] = origen
    cabeceras['Access-Control-Allow-Headers'] =
      pedidas || 'authorization, x-client-info, apikey, content-type, x-region'
    cabeceras['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    cabeceras['Access-Control-Max-Age'] = '86400'
  }
  return cabeceras
}

export function responder(req: Request, cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cabecerasCors(req), 'Content-Type': 'application/json' },
  })
}

export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: cabecerasCors(req) })
}

/** El cuerpo JSON de la petición, o un objeto vacío si no hay o no es JSON. */
export async function leerCuerpo(req: Request): Promise<Record<string, unknown>> {
  try {
    const cuerpo = await req.json()
    return cuerpo && typeof cuerpo === 'object' ? (cuerpo as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** Mensaje de un error cualquiera, corto, para logs y para `ultimo_error`. */
export function mensajeDe(e: unknown): string {
  const texto = e instanceof Error ? e.message : String(e)
  return texto.slice(0, 300)
}
