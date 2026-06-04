import { Nunito, Vazirmatn, Lalezar } from 'next/font/google';

/**
 * Fonts (handoff §4), loaded via next/font and exposed as CSS variables on
 * <html>. styles/globals.css maps the public tokens (--font-en, --font-body-fa,
 * --font-display-fa) onto these.
 */

// Nunito — primary app font (English). Variable weights.
export const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

// Vazirmatn — Persian body (variable 100–900).
export const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazirmatn',
});

// Lalezar — Persian display, single weight 400 only (never 700/900; scale via font-size).
export const lalezar = Lalezar({
  subsets: ['arabic', 'latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-lalezar',
});

/** Combined font variables for the <html> className. */
export const fontVariables = `${nunito.variable} ${vazirmatn.variable} ${lalezar.variable}`;
