import type { Config } from 'tailwindcss'

/** Color semántico apoyado en una variable de tokens.css, con opacidad de Tailwind. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

/** Las 11 categorías de color que comparten materias, eventos y actividades. */
const CATEGORIES = [
  'violet',
  'blue',
  'cyan',
  'teal',
  'green',
  'amber',
  'orange',
  'rose',
  'fuchsia',
  'indigo',
  'slate',
] as const

const cat = Object.fromEntries(CATEGORIES.map((c) => [c, token(`cat-${c}`)]))
const catSoft = Object.fromEntries(CATEGORIES.map((c) => [c, token(`cat-${c}-soft`)]))

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
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          soft: token('primary-soft'),
          on: token('on-primary'),
        },
        accent: {
          DEFAULT: token('accent'),
          strong: token('accent-strong'),
          soft: token('accent-soft'),
        },
        ok: { DEFAULT: token('ok'), soft: token('ok-soft') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        cat,
        'cat-soft': catSoft,
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        card: 'var(--shadow-card)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
