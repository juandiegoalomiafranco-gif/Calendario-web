import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Precarga la letra (el trozo latino de Plus Jakarta Sans, el único que usa el español).
 *
 * Sin esto el navegador solo la pide después de leer la hoja de estilos y de tener texto
 * que pintar, y la primera pantalla sale con la letra del sistema y salta al cambiarla.
 * El nombre del archivo lleva un hash, así que se busca en lo compilado.
 */
function precargarLetra(): Plugin {
  return {
    name: 'precargar-letra',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const letra = Object.keys(ctx.bundle ?? {}).find((f) =>
          /plus-jakarta-sans-latin-wght-normal-.*\.woff2$/.test(f),
        )
        if (!letra) return
        return [
          {
            tag: 'link',
            attrs: { rel: 'preload', href: `/${letra}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head',
          },
        ]
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), precargarLetra()],
  build: {
    rollupOptions: {
      output: {
        /*
         * Las librerías van en archivos propios. Cambian muy de vez en cuando, así que
         * su nombre (con hash) se mantiene entre despliegues y el iPhone las sigue
         * teniendo en caché: tras publicar un cambio solo baja de nuevo el código de la
         * app. Los iconos no van aquí: cada pantalla se lleva solo los suyos.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) {
            return 'react'
          }
          if (/node_modules\/(@supabase|iceberg-js|tslib)\//.test(id)) return 'supabase'
        },
      },
    },
  },
})
