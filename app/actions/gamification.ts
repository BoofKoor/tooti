'use server';
import { revalidatePath } from 'next/cache';
import { Prisma, type Progress } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  COMEBACK_GAP_DAYS,
  DAILY_GOAL_OPTIONS,
  TEST_SAMPLE_SIZE,
  TOTAL_HEARTS,
  XP_LEARN_STAGE,
  XP_STORY,
  computeLessonXp,
  daysBetween,
  evaluateMedals,
  isPerfect,
  localDay,
  nextStreak,
  streakMilestoneHit,
  testPassed,
} from '@/lib/gamification';

/** Coerce a client-supplied number into a trusted integer in [lo, hi]. */
function clampInt(v: unknown, lo: number, hi: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : lo;
  return Math.max(lo, Math.min(hi, n));
}

const DEFAULT_TZ = 'Asia/Tehran';

export type CompleteResult = {
  ok: boolean;
  failed?: boolean;
  passed?: boolean; // true on any successful completion; false = test below the bar
  xpEarned: number;
  totalXp: number;
  streak: number;
  newMedals: { key: string; name: string }[];
  streakMilestone: number | null;
};

/** One calendar day before a "YYYY-MM-DD" key (UTC math on the key — never on a
 *  wall-clock instant, which off-by-ones across DST and fractional tz offsets). */
function prevDayKey(dayKey: string): string {
  return localDay(new Date(Date.parse(`${dayKey}T00:00:00Z`) - 86_400_000), 'UTC');
}

/** Consecutive local days (ending today/yesterday) whose DailyXp ≥ dailyGoal. */
async function computeGoalStreak(
  db: Prisma.TransactionClient,
  userId: string,
  dailyGoal: number,
  tz: string,
  today: string,
): Promise<number> {
  const rows = await db.dailyXp.findMany({
    where: { userId },
    select: { day: true, xp: true },
  });
  const perDay = new Map(rows.map((r) => [r.day, r.xp]));
  // Allow the run to end today OR yesterday (so it doesn't vanish before today's activity).
  let cursor = (perDay.get(today) ?? 0) >= dailyGoal ? today : null;
  if (!cursor) {
    const yday = prevDayKey(today);
    if ((perDay.get(yday) ?? 0) >= dailyGoal) cursor = yday;
  }
  let run = 0;
  while (cursor && (perDay.get(cursor) ?? 0) >= dailyGoal) {
    run += 1;
    cursor = prevDayKey(cursor); // step one calendar day back
  }
  return run;
}

/**
 * Shared award path for any XP-earning event (lesson/test completion, replay,
 * Learn-stage read). The caller writes the LessonCompletion row FIRST so medal
 * counts include it. Updates Progress + the DailyXp ledger, then evaluates
 * medals.
 */
async function awardXp(o: {
  tx: Prisma.TransactionClient;
  userId: string;
  prior: Progress | null;
  xp: number;
  correctCount: number;
  tz: string;
  now: Date;
}): Promise<{
  totalXp: number;
  streak: number;
  newMedals: { key: string; name: string }[];
  streakMilestone: number | null;
}> {
  const { tx, userId, prior, xp, tz, now } = o;
  const today = localDay(now, tz);
  const prevLastDay = prior?.lastActiveDate ? localDay(prior.lastActiveDate, tz) : null;
  const cameBack = prevLastDay ? daysBetween(prevLastDay, today) >= COMEBACK_GAP_DAYS : false;
  const newStreak = nextStreak({ streak: prior?.streak ?? 0, lastActiveDay: prevLastDay }, today);

  const progress = await tx.progress.upsert({
    where: { userId },
    create: {
      userId,
      xp,
      streak: newStreak,
      lastActiveDate: now,
      timezone: tz,
      correctAnswers: o.correctCount,
    },
    update: {
      xp: { increment: xp },
      streak: newStreak,
      lastActiveDate: now,
      timezone: tz,
      correctAnswers: { increment: o.correctCount },
    },
  });

  // DailyXp ledger — credited to TODAY (the caller already gates same-day replays).
  await tx.dailyXp.upsert({
    where: { userId_day: { userId, day: today } },
    create: { userId, day: today, xp },
    update: { xp: { increment: xp } },
  });

  const [lessonsCompleted, perfectCount] = await Promise.all([
    tx.lessonCompletion.count({ where: { userId } }),
    tx.lessonCompletion.count({ where: { userId, perfect: true } }),
  ]);
  const goalStreakDays = await computeGoalStreak(tx, userId, progress.dailyGoal, tz, today);

  const evals = evaluateMedals({
    xp: progress.xp,
    correctAnswers: progress.correctAnswers,
    lessonsCompleted,
    hasPerfectLesson: perfectCount > 0,
    goalStreakDays,
    showupStreak: newStreak,
    cameBackFromBreak: cameBack,
  });

  const catalog = await tx.medal.findMany();
  const byKey = new Map(catalog.map((m) => [m.key, m]));
  const newMedals: { key: string; name: string }[] = [];
  for (const e of evals) {
    const medal = byKey.get(e.key);
    if (!medal) continue;
    const um = await tx.userMedal.findUnique({
      where: { userId_medalId: { userId, medalId: medal.id } },
    });
    const earnNow = e.earned && !um?.earnedAt;
    await tx.userMedal.upsert({
      where: { userId_medalId: { userId, medalId: medal.id } },
      create: { userId, medalId: medal.id, progress: e.progress, earnedAt: e.earned ? now : null },
      update: {
        progress: Math.max(um?.progress ?? 0, e.progress),
        ...(earnNow ? { earnedAt: now } : {}),
      },
    });
    if (earnNow) newMedals.push({ key: medal.key, name: medal.name });
  }

  return {
    totalXp: progress.xp,
    streak: newStreak,
    newMedals,
    streakMilestone: streakMilestoneHit(newStreak) ? newStreak : null,
  };
}

/** Persist a freshly-seen browser tz on no-award exits so later reads use it. */
async function persistTimezone(userId: string, tz: string, prior: Progress | null): Promise<void> {
  if (tz === prior?.timezone) return;
  await prisma.progress.upsert({
    where: { userId },
    create: { userId, timezone: tz },
    update: { timezone: tz },
  });
}

/**
 * Sequential unlock, server-side: a lesson is playable iff it's the first in
 * its unit or the previous `order` is completed. The pages enforce this too,
 * but a direct action call must not be able to skip the ladder. (Replays of
 * completed lessons are by definition unlocked.)
 */
async function lessonUnlocked(
  userId: string,
  lesson: { id: string; unitId: string; order: number },
): Promise<boolean> {
  const prev = await prisma.lesson.findFirst({
    where: { unitId: lesson.unitId, order: { lt: lesson.order } },
    orderBy: { order: 'desc' },
    select: { id: true },
  });
  if (!prev) return true; // first in unit
  const done = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId: prev.id } },
    select: { id: true },
  });
  return !!done;
}

export async function completeLesson(input: {
  slug: string;
  correctCount: number;
  totalCount: number;
  heartsLeft: number;
  timezone?: string;
}): Promise<CompleteResult> {
  const empty: CompleteResult = {
    ok: false,
    xpEarned: 0,
    totalXp: 0,
    streak: 0,
    newMedals: [],
    streakMilestone: null,
  };
  const session = await auth();
  if (!session?.user?.id) return empty;
  const userId = session.user.id;

  const prior = await prisma.progress.findUnique({ where: { userId } });
  // The stored tz is authoritative once set, so a client can't shift the local
  // day boundary (and farm streak/goal) by sending a different tz each call.
  const tz = prior?.timezone || input.timezone || DEFAULT_TZ;
  // Never trust raw client counts: hearts are bounded here, the per-lesson
  // question counts are bounded against the real lesson below.
  const heartsLeft = clampInt(input.heartsLeft, 0, TOTAL_HEARTS);

  // Hearts depleted → failed: persist tz only, no completion / no XP.
  if (heartsLeft <= 0) {
    await persistTimezone(userId, tz, prior);
    return {
      ok: true,
      failed: true,
      xpEarned: 0,
      totalXp: prior?.xp ?? 0,
      streak: prior?.streak ?? 0,
      newMedals: [],
      streakMilestone: null,
    };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { slug: input.slug },
    include: { unit: { select: { comingSoon: true } }, _count: { select: { exercises: true } } },
  });
  if (!lesson) return empty;

  // Locked (coming-soon unit or ladder not reached) → no writes at all.
  if (lesson.unit.comingSoon || !(await lessonUnlocked(userId, lesson))) return empty;

  // B1: the lesson's real question count is the ceiling — a SECTION_TEST plays a
  // fixed sample, every other kind plays its whole exercise set. Clamp the
  // client's self-reported score into [0, ceiling] so it can't mint XP/medals or
  // forge a checkpoint pass with correctCount: 1_000_000.
  // totalCount is taken from the lesson, NOT the client — otherwise a caller could
  // send totalCount: 1 and "pass" a SECTION_TEST with a single correct answer.
  const totalCount =
    lesson.kind === 'SECTION_TEST'
      ? Math.min(TEST_SAMPLE_SIZE, lesson._count.exercises)
      : lesson._count.exercises;
  const correctCount = clampInt(input.correctCount, 0, totalCount);

  // SECTION_TEST below the pass bar (even with hearts left) → not passed:
  // persist tz only — no completion, no XP, no streak/medal updates.
  if (lesson.kind === 'SECTION_TEST' && !testPassed(correctCount, totalCount)) {
    await persistTimezone(userId, tz, prior);
    return {
      ok: true,
      passed: false,
      xpEarned: 0,
      totalXp: prior?.xp ?? 0,
      streak: prior?.streak ?? 0,
      newMedals: [],
      streakMilestone: null,
    };
  }

  const now = new Date();
  const today = localDay(now, tz);
  const existing = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  const isFirst = !existing;
  const perfect = isPerfect(heartsLeft);
  // B3: a replay earns review XP at most once per local day for a given lesson —
  // re-finishing the same lesson on the same day awards nothing (no streak
  // refresh, no daily-goal padding). First play and the day's first replay still
  // count.
  const replayedToday = !!existing && localDay(existing.completedAt, tz) === today;
  const xp = replayedToday
    ? 0
    : computeLessonXp({ correctCount, heartsLeft, isFirstCompletion: isFirst });

  // B2: the completion row + every award write commit atomically, so a double-tap
  // / concurrent finish can't read a stale streak snapshot or double-count medals.
  const award = await prisma.$transaction(async (tx) => {
    await tx.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      create: {
        userId,
        lessonId: lesson.id,
        xpEarned: xp,
        heartsLeft,
        perfect,
        crownLevel: perfect ? 2 : 1,
      },
      update: {
        heartsLeft: Math.max(existing?.heartsLeft ?? 0, heartsLeft),
        perfect: (existing?.perfect ?? false) || perfect,
        crownLevel: Math.min(5, (existing?.crownLevel ?? 0) + (perfect ? 1 : 0)),
        completedAt: now,
      },
    });
    if (xp === 0) return null; // same-day replay: row touched, no ledger/streak/medals
    return awardXp({ tx, userId, prior, xp, correctCount, tz, now });
  });

  revalidatePath('/profile');
  revalidatePath('/learn');
  if (!award) {
    return {
      ok: true,
      passed: true,
      xpEarned: 0,
      totalXp: prior?.xp ?? 0,
      streak: prior?.streak ?? 0,
      newMedals: [],
      streakMilestone: null,
    };
  }
  return { ok: true, passed: true, xpEarned: xp, ...award };
}

/**
 * Learn-stage (kind LESSON) completion — flat XP_LEARN_STAGE, first time only.
 * Replays award nothing (it's reading, not practice).
 */
export async function completeLearnStage(input: {
  slug: string;
  timezone?: string;
}): Promise<CompleteResult> {
  const empty: CompleteResult = {
    ok: false,
    xpEarned: 0,
    totalXp: 0,
    streak: 0,
    newMedals: [],
    streakMilestone: null,
  };
  const session = await auth();
  if (!session?.user?.id) return empty;
  const userId = session.user.id;

  const lesson = await prisma.lesson.findUnique({
    where: { slug: input.slug },
    include: { unit: { select: { comingSoon: true } } },
  });
  if (!lesson || lesson.kind !== 'LESSON') return empty;

  // Locked (coming-soon unit or ladder not reached) → no writes at all.
  if (lesson.unit.comingSoon || !(await lessonUnlocked(userId, lesson))) return empty;

  const prior = await prisma.progress.findUnique({ where: { userId } });
  const tz = prior?.timezone || input.timezone || DEFAULT_TZ;

  const existing = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  if (existing) {
    // Already read → nothing extra to award (no replay XP for reading).
    await persistTimezone(userId, tz, prior);
    return {
      ok: true,
      passed: true,
      xpEarned: 0,
      totalXp: prior?.xp ?? 0,
      streak: prior?.streak ?? 0,
      newMedals: [],
      streakMilestone: null,
    };
  }

  const now = new Date();
  // B2: first-completion row + award commit atomically (double-tap safe).
  const award = await prisma.$transaction(async (tx) => {
    await tx.lessonCompletion.create({
      data: {
        userId,
        lessonId: lesson.id,
        xpEarned: XP_LEARN_STAGE,
        heartsLeft: 0,
        perfect: false,
        crownLevel: 1,
      },
    });
    return awardXp({ tx, userId, prior, xp: XP_LEARN_STAGE, correctCount: 0, tz, now });
  });
  revalidatePath('/profile');
  revalidatePath('/learn');
  return { ok: true, passed: true, xpEarned: XP_LEARN_STAGE, ...award };
}

/**
 * Story (kind STORY) completion — flat XP_STORY, first time only. Like the
 * Learn-stage read, replays award nothing (the inline questions are hearts-free,
 * so a story is never "failed"). Shares the unlock guard and award path.
 */
export async function completeStory(input: {
  slug: string;
  timezone?: string;
}): Promise<CompleteResult> {
  const empty: CompleteResult = {
    ok: false,
    xpEarned: 0,
    totalXp: 0,
    streak: 0,
    newMedals: [],
    streakMilestone: null,
  };
  const session = await auth();
  if (!session?.user?.id) return empty;
  const userId = session.user.id;

  const lesson = await prisma.lesson.findUnique({
    where: { slug: input.slug },
    include: { unit: { select: { comingSoon: true } } },
  });
  if (!lesson || lesson.kind !== 'STORY') return empty;

  // Locked (coming-soon unit or ladder not reached) → no writes at all.
  if (lesson.unit.comingSoon || !(await lessonUnlocked(userId, lesson))) return empty;

  const prior = await prisma.progress.findUnique({ where: { userId } });
  const tz = prior?.timezone || input.timezone || DEFAULT_TZ;

  const existing = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  if (existing) {
    // Already played → nothing extra to award (no replay XP).
    await persistTimezone(userId, tz, prior);
    return {
      ok: true,
      passed: true,
      xpEarned: 0,
      totalXp: prior?.xp ?? 0,
      streak: prior?.streak ?? 0,
      newMedals: [],
      streakMilestone: null,
    };
  }

  const now = new Date();
  // B2: first-completion row + award commit atomically (double-tap safe).
  const award = await prisma.$transaction(async (tx) => {
    await tx.lessonCompletion.create({
      data: {
        userId,
        lessonId: lesson.id,
        xpEarned: XP_STORY,
        heartsLeft: 0,
        perfect: false,
        crownLevel: 1,
      },
    });
    return awardXp({ tx, userId, prior, xp: XP_STORY, correctCount: 0, tz, now });
  });
  revalidatePath('/profile');
  revalidatePath('/learn');
  return { ok: true, passed: true, xpEarned: XP_STORY, ...award };
}

export async function setDailyGoal(goal: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  if (!(DAILY_GOAL_OPTIONS as readonly number[]).includes(goal)) return;
  await prisma.progress.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, dailyGoal: goal },
    update: { dailyGoal: goal },
  });
  revalidatePath('/profile');
}

export async function acknowledgeMedals(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.userMedal.updateMany({
    where: { userId: session.user.id, earnedAt: { not: null }, seenAt: null },
    data: { seenAt: new Date() },
  });
}
