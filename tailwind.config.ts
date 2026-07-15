import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff4ed',
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
        ink: {
          50: '#f6f6f7',
          100: '#e2e3e6',
          200: '#c5c7cd',
          300: '#9fa2ab',
          400: '#767a85',
          500: '#5b5e68',
          600: '#484a53',
          700: '#3a3b43',
          800: '#26272c',
          900: '#151519',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 20px -4px rgba(21, 21, 25, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
