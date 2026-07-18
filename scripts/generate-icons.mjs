// Genera los iconos PNG de la app (apple-touch-icon y manifest) a partir de la
// misma geometría que public/icon.svg, sin dependencias externas.
// Uso: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [0x15, 0x15, 0x19] // ink-900
const RING = [0xfb, 0x5a, 0x17] // brand-500
const ARC = [0x18, 0xba, 0x60] // ok-500

// Geometría en el espacio 128x128 del SVG: anillo r=40 stroke=10 centrado en (64,64),
// arco verde de (64,34) a (94,64) con puntas redondas.
function colorAt(u, v) {
  const dist = Math.hypot(u - 64, v - 64)
  const onRing = Math.abs(dist - 40) <= 5
  if (onRing) {
    const ang = Math.atan2(v - 64, u - 64)
    if (ang >= -Math.PI / 2 && ang <= 0) return ARC
  }
  if (Math.hypot(u - 64, v - 34) <= 5 || Math.hypot(u - 94, v - 64) <= 5) return ARC
  if (onRing) return RING
  return BG
}

function render(size) {
  const SS = 3 // supersampling 3x3 para suavizar bordes
  const pixels = Buffer.alloc(size * size * 3)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = ((x + (sx + 0.5) / SS) / size) * 128
          const v = ((y + (sy + 0.5) / SS) / size) * 128
          const c = colorAt(u, v)
          r += c[0]
          g += c[1]
          b += c[2]
        }
      }
      const i = (y * size + x) * 3
      pixels[i] = Math.round(r / (SS * SS))
      pixels[i + 1] = Math.round(g / (SS * SS))
      pixels[i + 2] = Math.round(b / (SS * SS))
    }
  }
  return pixels
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor RGB
  // compression 0, filter 0, interlace 0

  const stride = size * 3
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filtro "None" por scanline
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const OUTPUTS = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]

for (const [name, size] of OUTPUTS) {
  const file = join(PUBLIC_DIR, name)
  writeFileSync(file, encodePng(size, render(size)))
  console.log(`✓ ${name} (${size}x${size})`)
}
