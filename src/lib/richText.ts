/**
 * Saneado del HTML del editor de notas.
 *
 * El contenido lo escribe el propio usuario, pero también llega por pegado desde
 * Word, Google Docs o una página web, que traen `<script>`, estilos y atributos de
 * todo tipo. Guardamos solo una lista corta de etiquetas y ningún atributo, así lo
 * que se guarda en Supabase es siempre texto con formato y nada más.
 */

const ALLOWED = new Set([
  'P',
  'BR',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'MARK',
  'H2',
  'H3',
  'UL',
  'OL',
  'LI',
  'DIV',
])

/** Etiquetas que se cambian por su equivalente semántico. */
const REPLACE: Record<string, string> = { STRONG: 'B', EM: 'I' }

/** Etiquetas de bloque: un <p> no puede contenerlas. */
const BLOCK = new Set(['P', 'DIV', 'UL', 'OL', 'H2', 'H3'])

function tieneBloques(el: Element): boolean {
  return Array.from(el.children).some((c) => BLOCK.has(c.tagName))
}

function reemplazarEtiqueta(el: Element, tag: string) {
  const nuevo = document.createElement(tag)
  nuevo.append(...Array.from(el.childNodes))
  el.replaceWith(nuevo)
}

export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return html
  const root = document.createElement('div')
  root.innerHTML = html

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      walk(child)

      if (!ALLOWED.has(child.tagName)) {
        // Se conserva el texto de dentro y se descarta la etiqueta.
        child.replaceWith(...Array.from(child.childNodes))
        continue
      }

      for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name)

      if (child.tagName === 'DIV') {
        // El navegador envuelve en <div> lo que escribes. Si dentro solo hay texto,
        // es un párrafo; si dentro hay listas o títulos, el <div> sobra y se quita:
        // convertirlo en <p> generaría <p><ul>…, que el navegador vuelve a partir y
        // deja la nota descuadrada al releerla.
        if (tieneBloques(child)) child.replaceWith(...Array.from(child.childNodes))
        else reemplazarEtiqueta(child, 'P')
        continue
      }

      // Un <p> que acabó conteniendo bloques (por pegado) se deshace igual.
      if (child.tagName === 'P' && tieneBloques(child)) {
        child.replaceWith(...Array.from(child.childNodes))
        continue
      }

      const swap = REPLACE[child.tagName]
      if (swap) reemplazarEtiqueta(child, swap)
    }
  }
  walk(root)
  return root.innerHTML
}

/** Texto plano de una nota, para buscar y para los resúmenes de las tarjetas. */
export function htmlToText(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ')
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** ¿Esto ya es HTML, o es una nota vieja guardada como texto plano? */
export function isHtml(body: string): boolean {
  return /<(p|br|ul|ol|li|h2|h3|b|i|u|mark|div)\b/i.test(body)
}

/** Sube una nota antigua de texto plano a HTML, respetando sus saltos de línea. */
export function textToHtml(text: string): string {
  const escape = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** El cuerpo de una nota, siempre como HTML seguro. */
export function noteHtml(body: string): string {
  if (!body) return ''
  return sanitizeHtml(isHtml(body) ? body : textToHtml(body))
}
