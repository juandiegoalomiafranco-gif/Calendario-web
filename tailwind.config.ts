import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema oscuro: brand e ink están "invertidos" — los números bajos son
        // los tonos oscuros (fondos) y los altos los claros (texto).
        brand: {
          50: '#2a1216',
          100: '#3f1721',
          200: '#5c1e2c',
          300: '#9c2438',
          400: '#d92e47',
          500: '#f43f5e',
          600: '#f9647b',
          700: '#fca5b1',
          800: '#fdc7ce',
          900: '#fee4e7',
        },
        ok: {
          50: '#0e2a1c',
          100: '#123324',
          200: '#175c39',
          300: '#1f7d4c',
          400: '#22a35f',
          500: '#2ebd72',
          600: '#5ad693',
          700: '#8ce7b5',
          800: '#bbf2d3',
          900: '#e2fbec',
        },
        ink: {
          50: '#0b0b0d',
          100: '#24262b',
          200: '#34363d',
          300: '#4a4d55',
          400: '#8b8e98',
          500: '#a6aab4',
          600: '#c2c5cc',
          700: '#d8dade',
          800: '#eaebee',
          900: '#f5f5f7',
        },
        card: '#17181c',
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
