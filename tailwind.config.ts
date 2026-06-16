import type { Config } from 'tailwindcss';

/**
 * Tailwind theme mapping — handoff §6.
 *
 * Every utility resolves to a CSS custom property defined in styles/globals.css
 * (§5). That file is the single source of truth for token VALUES; this config
 * only wires names → variables. Nothing here hardcodes a raw hex/px/ms — change
 * a value once in globals.css and it propagates to both `var(--token)` usage and
 * these Tailwind utilities.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          ink: 'var(--color-primary-ink)',
          tint: 'var(--color-primary-tint)',
        },
        correct: {
          DEFAULT: 'var(--color-correct)',
          ink: 'var(--color-correct-ink)',
          tint: 'var(--color-correct-tint)',
        },
        streak: {
          DEFAULT: 'var(--color-streak)',
          ink: 'var(--color-streak-ink)',
          tint: 'var(--color-streak-tint)',
        },
        xp: {
          DEFAULT: 'var(--color-xp)',
          ink: 'var(--color-xp-ink)',
          tint: 'var(--color-xp-tint)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          ink: 'var(--color-error-ink)',
          tint: 'var(--color-error-tint)',
        },
        coral: {
          DEFAULT: 'var(--color-coral)',
          ink: 'var(--color-coral-ink)',
          tint: 'var(--color-coral-tint)',
        },
        purple: {
          DEFAULT: 'var(--color-purple)',
          ink: 'var(--color-purple-ink)',
        },
        pink: {
          DEFAULT: 'var(--color-pink)',
          ink: 'var(--color-pink-ink)',
          tint: 'var(--color-pink-tint)',
        },
        teal: 'var(--color-teal)',
        yellow: 'var(--color-yellow)',
        parrot: {
          DEFAULT: 'var(--color-parrot)',
          ink: 'var(--color-parrot-ink)',
          tint: 'var(--color-parrot-tint)',
        },
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          '2': 'var(--color-surface-2)',
          '3': 'var(--color-surface-3)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          '1': 'var(--color-text-1)',
          '2': 'var(--color-text-2)',
          '3': 'var(--color-text-3)',
          inverse: 'var(--color-text-inverse)',
        },
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
        '3': 'var(--shadow-3)',
        '4': 'var(--shadow-4)',
      },
      backgroundImage: {
        // Gradient tokens; usable as `bg-xp` / `bg-streak` / `bg-unit`.
        xp: 'var(--grad-xp)',
        streak: 'var(--grad-streak)',
        unit: 'var(--grad-unit)',
      },
      maxWidth: {
        // Mobile app column width (Phase 2 app shell).
        app: 'var(--app-max-w)',
      },
      fontFamily: {
        en: ['var(--font-en)'],
        'fa-display': ['var(--font-display-fa)'],
        'fa-body': ['var(--font-body-fa)'],
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        playful: 'var(--ease-playful)',
        spring: 'var(--ease-spring)',
      },
      transitionDuration: {
        instant: 'var(--dur-instant)',
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
        celebrate: 'var(--dur-celebrate)',
      },
    },
  },
  plugins: [],
};

export default config;
