import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Service worker: sin esto la app era "instalable" pero no abría sin red.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mis Finanzas',
        short_name: 'Finanzas',
        description: 'Tus cuentas, gastos, presupuesto y metas de ahorro en un solo lugar.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0b0d',
        theme_color: '#0b0b0d',
        orientation: 'portrait',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // La invitación es una página aparte con su propio HTML: que el SW no
        // intente servir el shell de la app en su lugar.
        navigateFallbackDenylist: [/^\/invitacion/],
      },
    }),
  ],
})
