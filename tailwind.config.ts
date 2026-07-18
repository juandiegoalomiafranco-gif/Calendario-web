import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#2a1812',
          100: '#ffe6d5',
          200: '#ffc9aa',
          300: '#ffa374',
          400: '#ff7a3c',
          500: '#fb5a17',
          600: '#ec3f0d',
          700: '#c42b0c',
          800: '#9c2412',
          900: '#7e2112',
        },
        ok: {
          50: '#eefdf3',
          100: '#d6fae1',
          200: '#b0f3c7',
          300: '#78e8a5',
          400: '#3ed57e',
          500: '#18ba60',
          600: '#0f954c',
          700: '#0f753f',
          800: '#115c35',
          900: '#0f4c2e',
        },
        // Escala invertida: la app es oscura, así que ink-50 es el fondo casi negro
        // e ink-900 el texto casi blanco.
        ink: {
          50: '#0b0b0d',
          100: '#26272c',
          200: '#3a3b43',
          300: '#5b5e68',
          400: '#8b8e98',
          500: '#a2a5ae',
          600: '#c5c7cd',
          700: '#e2e3e6',
          800: '#eef0f2',
          900: '#f7f7f8',
        },
        card: '#1a1b1f',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 20px -4px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
} satisfies Config
