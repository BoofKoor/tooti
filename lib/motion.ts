import type { Variants } from 'framer-motion';

/**
 * Framer Motion variants derived from the motion tokens (handoff §5).
 *
 * Framer needs numeric seconds and cubic-bezier arrays rather than CSS strings,
 * so `duration` and `ease` mirror the --dur-* / --ease-* tokens 1:1. Keep them
 * in sync with styles/globals.css — those CSS tokens remain the source of truth
 * for the equivalent CSS transitions.
 */
export const duration = {
  instant: 0.1,
  fast: 0.16,
  base: 0.24,
  slow: 0.36,
  celebrate: 0.6,
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  playful: [0.34, 1.4, 0.64, 1] as [number, number, number, number],
  spring: [0.34, 1.4, 0.64, 1] as [number, number, number, number],
};

/** Entrance fade + slide-up (uses the calm "out" easing). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
};

/** Playful pop-in with overshoot (buttons, toasts, correct-answer). */
export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: duration.fast, ease: ease.playful } },
};

/** Stagger container for lists / paths. */
export const staggerChildren: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
