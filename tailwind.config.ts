import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff3ec',
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
        // Tema claro: ink-50 es el fondo casi blanco e ink-900 el texto casi negro.
        ink: {
          50: '#f6f6f8',
          100: '#eeeff2',
          200: '#e3e4e9',
          300: '#c9ccd4',
          400: '#9a9ea9',
          500: '#71757f',
          600: '#565a64',
          700: '#3a3d45',
          800: '#23262d',
          900: '#101216',
        },
        card: '#ffffff',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'ui-serif', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 18, 22, 0.04), 0 10px 30px -12px rgba(16, 18, 22, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config
