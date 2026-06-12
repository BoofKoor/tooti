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
  lesson: {
    // SECTION_TEST "not passed" explanation (the 80% bar).
    testBar: 'برای قبولی در آزمون باید دست‌کم ۸۰٪ پاسخ‌ها درست باشد. دوباره تلاش کن!',
  },
} as const;

export type Fa = typeof fa;
