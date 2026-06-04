/**
 * The "necessary Persian" dictionary (typed) — handoff §2.
 *
 * Persian appears ONLY at comprehension-critical points (lesson instructions,
 * grammar/hints, error explanations, onboarding, placement test, paywall /
 * account / legal). Keep strings here, typed, rather than scattered in JSX.
 * Render them inside a `.fa` / `.fa-display` element with dir="rtl".
 */
export const fa = {
  welcome: {
    tagline: 'انگلیسی را مثل بازی یاد بگیر',
  },
} as const;

export type Fa = typeof fa;
