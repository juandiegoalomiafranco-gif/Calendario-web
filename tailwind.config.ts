import type { Config } from 'tailwindcss'

/** Color semántico apoyado en una variable CSS de tokens.css, con opacidad de Tailwind. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: {
          DEFAULT: token('surface'),
          2: token('surface-2'),
          3: token('surface-3'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        content: {
          DEFAULT: token('text'),
          muted: token('text-muted'),
          subtle: token('text-subtle'),
        },
        brand: {
          DEFAULT: token('brand'),
          strong: token('brand-strong'),
          soft: token('brand-soft'),
          on: token('on-brand'),
        },
        ok: {
          DEFAULT: token('ok'),
          soft: token('ok-soft'),
        },
        warn: {
          DEFAULT: token('warn'),
          soft: token('warn-soft'),
        },
        // Un color por familia de actividad: puntos, bloques del calendario y barras
        // de Progreso hablan todos el mismo idioma visual.
        act: {
          run: token('act-run'),
          goal: token('act-goal'),
          swim: token('act-swim'),
          strength: token('act-strength'),
          flex: token('act-flex'),
          rest: token('act-rest'),
        },
        'act-soft': {
          run: token('act-run-soft'),
          goal: token('act-goal-soft'),
          swim: token('act-swim-soft'),
          strength: token('act-strength-soft'),
          flex: token('act-flex-soft'),
          rest: token('act-rest-soft'),
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        card: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
