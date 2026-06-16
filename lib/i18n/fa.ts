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
  listen: {
    // Shown when the browser has no speech voice — the sentence is revealed so the
    // listening item stays solvable as a word-order exercise instead.
    audioFallback: 'صدای مرورگرت در دسترس نیست؛ جمله نوشته شده تا بتوانی کلمه‌ها را مرتب کنی.',
  },
  study: {
    // VIDEO section fallback hint (much of the audience is on filtered networks).
    videoFallback: 'اگر ویدیو باز نشد، ممکن است به دسترسیِ آزاد به اینترنت نیاز داشته باشد.',
  },
} as const;

export type Fa = typeof fa;
