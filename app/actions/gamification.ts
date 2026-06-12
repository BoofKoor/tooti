'use server';
import { revalidatePath } from 'next/cache';
import type { Progress } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  COMEBACK_GAP_DAYS,
  DAILY_GOAL_OPTIONS,
  XP_LEARN_STAGE,
  computeLessonXp,
  daysBetween,
  evaluateMedals,
  isPerfect,
  localDay,
  nextStreak,
  streakMilestoneHit,
  testPassed,
} from '@/lib/gamification';

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

/** Consecutive local days (ending today/yesterday) whose DailyXp ≥ dailyGoal. */
async function computeGoalStreak(userId: string, dailyGoal: number, tz: string): Promise<number> {
  const rows = await prisma.dailyXp.findMany({
    where: { userId },
    select: { day: true, xp: true },
  });
  const perDay = new Map(rows.map((r) => [r.day, r.xp]));
  const today = localDay(new Date(), tz);
  // Allow the run to end today OR yesterday (so it doesn't vanish before today's activity).
  let cursor = (perDay.get(today) ?? 0) >= dailyGoal ? today : null;
  if (!cursor) {
    const y = new Date(Date.now() - 86_400_000);
    const yday = localDay(y, tz);
    if ((perDay.get(yday) ?? 0) >= dailyGoal) cursor = yday;
  }
  let run = 0;
  while (cursor && (perDay.get(cursor) ?? 0) >= dailyGoal) {
    run += 1;
    const prev = new Date(Date.parse(`${cursor}T00:00:00Z`) - 86_400_000);
    cursor = localDay(prev, 'UTC'); // step one calendar day back (UTC math on the YYYY-MM-DD key)
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
  const { userId, prior, xp, tz, now } = o;
  const today = localDay(now, tz);
  const prevLastDay = prior?.lastActiveDate ? localDay(prior.lastActiveDate, tz) : null;
  const cameBack = prevLastDay ? daysBetween(prevLastDay, today) >= COMEBACK_GAP_DAYS : false;
  const newStreak = nextStreak({ streak: prior?.streak ?? 0, lastActiveDay: prevLastDay }, today);

  const progress = await prisma.progress.upsert({
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

  // DailyXp ledger — credited to TODAY (first completions and replays alike).
  await prisma.dailyXp.upsert({
    where: { userId_day: { userId, day: today } },
    create: { userId, day: today, xp },
    update: { xp: { increment: xp } },
  });

  const [lessonsCompleted, perfectCount] = await Promise.all([
    prisma.lessonCompletion.count({ where: { userId } }),
    prisma.lessonCompletion.count({ where: { userId, perfect: true } }),
  ]);
  const goalStreakDays = await computeGoalStreak(userId, progress.dailyGoal, tz);

  const evals = evaluateMedals({
    xp: progress.xp,
    correctAnswers: progress.correctAnswers,
    lessonsCompleted,
    hasPerfectLesson: perfectCount > 0,
    goalStreakDays,
    showupStreak: newStreak,
    cameBackFromBreak: cameBack,
  });

  const catalog = await prisma.medal.findMany();
  const byKey = new Map(catalog.map((m) => [m.key, m]));
  const newMedals: { key: string; name: string }[] = [];
  for (const e of evals) {
    const medal = byKey.get(e.key);
    if (!medal) continue;
    const um = await prisma.userMedal.findUnique({
      where: { userId_medalId: { userId, medalId: medal.id } },
    });
    const earnNow = e.earned && !um?.earnedAt;
    await prisma.userMedal.upsert({
      where: { userId_medalId: { userId, medalId: medal.id } },
      create: { userId, medalId: medal.id, progress: e.progress, earnedAt: e.earned ? now : null },
      update: {
        progress: Math.max(um?.progress ?? 0, e.progress),
        ...(earnNow ? { earnedAt: now } : {}),
      },
    });
    if (earnNow) newMedals.push({ key: medal.key, name: medal.name });
  }

  revalidatePath('/profile');
  revalidatePath('/learn');
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
  const tz = input.timezone || prior?.timezone || DEFAULT_TZ;

  // Hearts depleted → failed: persist tz only, no completion / no XP.
  if (input.heartsLeft <= 0) {
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

  const lesson = await prisma.lesson.findUnique({ where: { slug: input.slug } });
  if (!lesson) return empty;

  // SECTION_TEST below the pass bar (even with hearts left) → not passed:
  // persist tz only — no completion, no XP, no streak/medal updates.
  if (lesson.kind === 'SECTION_TEST' && !testPassed(input.correctCount, input.totalCount)) {
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
  const existing = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  });
  const isFirst = !existing;
  const perfect = isPerfect(input.heartsLeft);
  const xp = computeLessonXp({
    correctCount: input.correctCount,
    heartsLeft: input.heartsLeft,
    isFirstCompletion: isFirst,
  });

  await prisma.lessonCompletion.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: {
      userId,
      lessonId: lesson.id,
      xpEarned: xp,
      heartsLeft: input.heartsLeft,
      perfect,
      crownLevel: perfect ? 2 : 1,
    },
    update: {
      heartsLeft: Math.max(existing?.heartsLeft ?? 0, input.heartsLeft),
      perfect: (existing?.perfect ?? false) || perfect,
      crownLevel: Math.min(5, (existing?.crownLevel ?? 0) + (perfect ? 1 : 0)),
      completedAt: now,
    },
  });

  const award = await awardXp({
    userId,
    prior,
    xp,
    correctCount: input.correctCount,
    tz,
    now,
  });
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

  const lesson = await prisma.lesson.findUnique({ where: { slug: input.slug } });
  if (!lesson || lesson.kind !== 'LESSON') return empty;

  const prior = await prisma.progress.findUnique({ where: { userId } });
  const tz = input.timezone || prior?.timezone || DEFAULT_TZ;

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
  await prisma.lessonCompletion.create({
    data: {
      userId,
      lessonId: lesson.id,
      xpEarned: XP_LEARN_STAGE,
      heartsLeft: 0,
      perfect: false,
      crownLevel: 1,
    },
  });

  const award = await awardXp({ userId, prior, xp: XP_LEARN_STAGE, correctCount: 0, tz, now });
  return { ok: true, passed: true, xpEarned: XP_LEARN_STAGE, ...award };
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
