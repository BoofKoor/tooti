/**
 * Phase 4 gamification rules — pure, DB-free, React-free helpers + constants.
 * Unit-testable in isolation; the server actions (app/actions/gamification.ts)
 * and the Profile/Lesson screens consume these.
 */
export const XP_PER_CORRECT = 10;
export const XP_LESSON_COMPLETE = 20;
export const XP_PERFECT_BONUS = 10; // 0 hearts lost
export const XP_REVIEW = 5; // flat XP for replaying an already-completed lesson
export const XP_LEARN_STAGE = 15; // flat, first completion of a Learn (LESSON) stage only
export const TEST_PASS_PCT = 0.8; // SECTION_TEST pass threshold
export const TOTAL_HEARTS = 5;
export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;
export const DEFAULT_DAILY_GOAL = 20;
export const STREAK_MILESTONES = [3, 7, 14, 30]; // + every multiple of 30 after 30
export const COMEBACK_GAP_DAYS = 7;

export function isPerfect(heartsLeft: number): boolean {
  return heartsLeft >= TOTAL_HEARTS;
}

/** SECTION_TEST verdict — below the bar (even with hearts left) is a fail. */
export function testPassed(correct: number, total: number): boolean {
  return total > 0 && correct / total >= TEST_PASS_PCT;
}

export function computeLessonXp(o: {
  correctCount: number;
  heartsLeft: number;
  isFirstCompletion: boolean;
}): number {
  if (!o.isFirstCompletion) return XP_REVIEW;
  return (
    o.correctCount * XP_PER_CORRECT +
    XP_LESSON_COMPLETE +
    (isPerfect(o.heartsLeft) ? XP_PERFECT_BONUS : 0)
  );
}

/** Local calendar day "YYYY-MM-DD" for an instant in an IANA tz. */
export function localDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Whole days from aDay → bDay (both "YYYY-MM-DD"). */
export function daysBetween(aDay: string, bDay: string): number {
  const a = Date.parse(`${aDay}T00:00:00Z`);
  const b = Date.parse(`${bDay}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Show-up streak after an XP-earning event today. */
export function nextStreak(
  prev: { streak: number; lastActiveDay: string | null },
  today: string,
): number {
  if (!prev.lastActiveDay) return 1;
  const gap = daysBetween(prev.lastActiveDay, today);
  if (gap <= 0) return prev.streak; // same local day / skew → unchanged
  if (gap === 1) return prev.streak + 1; // consecutive
  return 1; // missed ≥1 day → reset (today = day 1)
}

/** What to DISPLAY now: a stored streak is "broken" if last activity is older than yesterday. */
export function effectiveStreak(
  streak: number,
  lastActiveDay: string | null,
  today: string,
): number {
  if (!lastActiveDay) return 0;
  return daysBetween(lastActiveDay, today) <= 1 ? streak : 0;
}

export function streakMilestoneHit(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak) || (streak > 30 && streak % 30 === 0);
}

export type MedalStats = {
  xp: number;
  correctAnswers: number;
  lessonsCompleted: number;
  hasPerfectLesson: boolean;
  goalStreakDays: number; // current consecutive goal-met run (for week-champ)
  showupStreak: number; // for hot-streak
  cameBackFromBreak: boolean; // this completion ended a ≥COMEBACK_GAP_DAYS gap
};
export type MedalEval = { key: string; progress: number; earned: boolean };

const pct = (n: number, d: number) => Math.max(0, Math.min(100, Math.round((n / d) * 100)));

export function evaluateMedals(s: MedalStats): MedalEval[] {
  return [
    {
      key: 'first-lesson',
      earned: s.lessonsCompleted >= 1,
      progress: s.lessonsCompleted >= 1 ? 100 : 0,
    },
    { key: '100-xp', earned: s.xp >= 100, progress: pct(s.xp, 100) },
    { key: '500-xp', earned: s.xp >= 500, progress: pct(s.xp, 500) },
    { key: '40-questions', earned: s.correctAnswers >= 40, progress: pct(s.correctAnswers, 40) },
    { key: 'perfect-lesson', earned: s.hasPerfectLesson, progress: s.hasPerfectLesson ? 100 : 0 },
    { key: 'week-champ', earned: s.goalStreakDays >= 7, progress: pct(s.goalStreakDays, 7) },
    { key: 'hot-streak', earned: s.showupStreak >= 30, progress: pct(s.showupStreak, 30) },
    {
      key: 'tooti-favorite',
      earned: s.cameBackFromBreak,
      progress: s.cameBackFromBreak ? 100 : 0,
    },
  ];
}
