'use client';
import { useEffect, useState } from 'react';

/**
 * Tracks the user's `prefers-reduced-motion` setting. Starts `false` so SSR and
 * first paint match the common case, then corrects on mount and on change. Used
 * to gate JS-driven motion (the XP count-up, the lesson-complete confetti); pure
 * CSS animations are additionally disabled via the catch-all media block in
 * styles/globals.css.
 */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduce;
}
