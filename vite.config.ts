import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Service worker: la app se usa corriendo, muchas veces sin señal. Reutiliza
    // el `public/manifest.json` que ya existía (por eso `manifest: false`).
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      injectRegister: 'auto',
      includeAssets: ['manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,json}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
