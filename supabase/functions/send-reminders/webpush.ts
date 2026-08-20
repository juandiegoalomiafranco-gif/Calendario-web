/**
 * Web Push (RFC 8291 + RFC 8292) implementado a mano sobre Web Crypto.
 *
 * Se hace aquí en vez de traerse una librería porque el runtime de las Edge
 * Functions es Deno y las librerías de web-push más conocidas están pensadas para
 * Node: cada actualización suya es una forma nueva de que los avisos dejen de salir
 * sin que nadie se entere. El protocolo cabe en un archivo y no cambia.
 *
 *   - Contenido cifrado con aes128gcm (RFC 8188), clave derivada por ECDH P-256 +
 *     HKDF-SHA256 con el `auth` de la suscripción (RFC 8291).
 *   - Autenticación VAPID: un JWT ES256 firmado con la clave privada del servidor.
 */

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export interface VapidKeys {
  publicKey: string
  /** Componentes JWK de la clave privada P-256. */
  d: string
  x: string
  y: string
  subject: string
}

const enc = new TextEncoder()

function b64urlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

/**
 * HKDF-SHA256 escrito con HMAC en vez de con `deriveBits`: extract y un único bloque
 * de expand. Todas las salidas que necesita Web Push (32, 16 y 12 bytes) caben en un
 * bloque, así que no hace falta iterar.
 */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const prkKey = await crypto.subtle.importKey(
    'raw',
    salt,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, ikm))

  const expandKey = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const out = new Uint8Array(
    await crypto.subtle.sign('HMAC', expandKey, concat(info, new Uint8Array([1]))),
  )
  return out.slice(0, length)
}

/** Cifra el payload para esa suscripción y devuelve el cuerpo aes128gcm completo. */
async function encryptPayload(sub: PushSubscription, payload: string) {
  const uaPublic = b64urlToBytes(sub.p256dh)
  const authSecret = b64urlToBytes(sub.auth)

  const asKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey))

  const uaKey = await crypto.subtle.importKey(
    'raw',
    uaPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256),
  )

  // IKM: mezcla el secreto ECDH con el `auth` de la suscripción y ambas claves.
  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic)
  const ikm = await hkdf(authSecret, shared, keyInfo, 32)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  // 0x02 marca que este es el último (y único) registro del cuerpo.
  const plaintext = concat(enc.encode(payload), new Uint8Array([2]))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plaintext),
  )

  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096)
  const header = concat(salt, rs, new Uint8Array([asPublic.length]), asPublic)
  return concat(header, ciphertext)
}

/** JWT ES256 con el que el servidor se identifica ante el servicio de push. */
async function vapidHeader(endpoint: string, keys: VapidKeys): Promise<string> {
  const aud = new URL(endpoint).origin
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = bytesToB64url(
    enc.encode(
      JSON.stringify({
        aud,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: keys.subject,
      }),
    ),
  )
  const signingInput = `${header}.${claims}`

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: keys.d, x: keys.x, y: keys.y, ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  // WebCrypto ya devuelve la firma como r||s crudo, que es lo que espera JWS.
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, enc.encode(signingInput)),
  )
  return `vapid t=${signingInput}.${bytesToB64url(sig)}, k=${keys.publicKey}`
}

export interface EnvioResultado {
  ok: boolean
  status: number
  /** La suscripción ya no existe: hay que borrarla de la tabla. */
  caducada: boolean
}

export async function enviarPush(
  sub: PushSubscription,
  payload: string,
  keys: VapidKeys,
  ttlSegundos = 12 * 60 * 60,
): Promise<EnvioResultado> {
  const body = await encryptPayload(sub, payload)
  const auth = await vapidHeader(sub.endpoint, keys)

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttlSegundos),
    },
    body,
  })

  return {
    ok: res.ok,
    status: res.status,
    // 404/410: el navegador tiró la suscripción (app desinstalada, permiso revocado).
    caducada: res.status === 404 || res.status === 410,
  }
}
