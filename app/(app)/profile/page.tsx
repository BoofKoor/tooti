import type { CSSProperties } from 'react';
import { BookOpen, Check, Flame, Lightning, Medal as MedalIcon } from '@phosphor-icons/react/dist/ssr';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Mascot, Medal } from '@/components/ui';
import type { MedalState, MedalType } from '@/components/ui';
import { DEFAULT_DAILY_GOAL, effectiveStreak, localDay } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import { DailyGoalPicker } from './_daily-goal-picker';
import { MedalAcknowledger } from './_medal-acknowledger';
import { ProfileActions } from './_profile-actions';

/*
 * Profile — real data, English / LTR. Inside the (app) shell (TabBar from the
 * layout). Rebuilt hero: a brand-teal cover with an overlapping avatar wrapped in
 * a level-progress ring, bold identity, and a level bar; then a 2×2 stat grid and
 * the daily-goal / this-week / achievements cards. Request-time only → dynamic.
 */

const FALLBACK_TZ = 'Asia/Tehran';
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const XP_PER_LEVEL = 500; // gentle, legible level curve (display-only)

function medalState(um?: {
  progress: number;
  earnedAt: Date | null;
  seenAt: Date | null;
}): MedalState {
  if (!um || (um.progress === 0 && !um.earnedAt)) return 'locked';
  if (um.earnedAt && !um.seenAt) return 'recently';
  if (um.earnedAt) return 'earned';
  return 'in-progress';
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null; // the (app) layout already guards this
  const userId = session.user.id;

  const [user, progress, dailyXp, catalog, userMedals, lessonsDone] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.progress.findUnique({ where: { userId } }),
    prisma.dailyXp.findMany({ where: { userId }, select: { day: true, xp: true } }),
    prisma.medal.findMany({ orderBy: { order: 'asc' } }),
    prisma.userMedal.findMany({ where: { userId } }),
    prisma.lessonCompletion.count({ where: { userId } }),
  ]);

  const tz = progress?.timezone ?? FALLBACK_TZ;
  const dailyGoal = progress?.dailyGoal ?? DEFAULT_DAILY_GOAL;
  const totalXp = progress?.xp ?? 0;
  const today = localDay(new Date(), tz);
  const lastActiveDay = progress?.lastActiveDate ? localDay(progress.lastActiveDate, tz) : null;
  const streak = effectiveStreak(progress?.streak ?? 0, lastActiveDay, today);

  // Level from total XP (display-only curve): each level is XP_PER_LEVEL apart.
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const intoLevel = totalXp % XP_PER_LEVEL;
  const levelPct = Math.round((intoLevel / XP_PER_LEVEL) * 100);
  const xpToNext = XP_PER_LEVEL - intoLevel;

  // XP per local day from the DailyXp ledger (the single source of truth —
  // replays credit the day they happen, not the first-completion day).
  const perDay = new Map(dailyXp.map((d) => [d.day, d.xp]));
  const todayXp = perDay.get(today) ?? 0;
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((todayXp / dailyGoal) * 100)) : 0;

  // Last 7 local days (oldest → newest), stepping back on the YYYY-MM-DD key.
  const days: string[] = [];
  let cur = today;
  for (let i = 0; i < 7; i += 1) {
    days.push(cur);
    cur = localDay(new Date(Date.parse(`${cur}T00:00:00Z`) - 86_400_000), 'UTC');
  }
  days.reverse();
  const week = days.map((day) => {
    const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
    const xp = perDay.get(day) ?? 0;
    const isToday = day === today;
    const done = xp >= dailyGoal;
    return {
      lbl: WEEKDAY_INITIALS[dow],
      state: isToday ? 'today' : done ? 'done' : '',
      kind: done ? 'done' : isToday ? 'today' : 'idle',
      xp,
    };
  });
  const weekDoneCount = week.filter((d) => d.kind === 'done').length;

  // Medals: full catalog joined with the user's rows → derived state.
  const umByMedalId = new Map(userMedals.map((um) => [um.medalId, um]));
  const medals = catalog.map((m) => {
    const um = umByMedalId.get(m.id);
    return {
      key: m.key as MedalType,
      name: m.name,
      state: medalState(um),
      progress: um?.progress ?? 0,
    };
  });
  const earnedCount = userMedals.filter((um) => um.earnedAt).length;
  const totalMedals = catalog.length;
  const hasRecently = medals.some((m) => m.state === 'recently');

  // Identity from the user record.
  const emailLocal = user?.email?.split('@')[0] ?? 'learner';
  const displayName = user?.name ?? emailLocal;
  const handle = `@${emailLocal.toLowerCase().replace(/[^a-z0-9_]+/g, '')}`;
  const daysWithTooti = user?.createdAt
    ? Math.max(0, Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000))
    : 0;

  return (
    <div className="prof min-h-0 flex-1" dir="ltr">
      <div className="prof-scroll">
        {/* ── Hero header — brand cover + level-ring avatar + identity ── */}
        <header className="pf-hero">
          <div className="pf-cover">
            <span className="pf-cover-blob pf-cover-blob--1" aria-hidden="true" />
            <span className="pf-cover-blob pf-cover-blob--2" aria-hidden="true" />
            <div className="pf-cover-actions">
              <ProfileActions currentName={displayName} />
            </div>
          </div>

          <div className="pf-id">
            <div className="pf-avatar-ring" style={{ '--p': levelPct } as CSSProperties}>
              <div className="pf-avatar">
                <Mascot pose="encourage" />
              </div>
              <span className="pf-level-badge">Lv {level}</span>
            </div>
            <h1 className="pf-name">{displayName}</h1>
            <p className="pf-meta">
              {handle} · {daysWithTooti} {daysWithTooti === 1 ? 'day' : 'days'} with Tooti
            </p>
            <div className="pf-level">
              <div className="pf-level-bar">
                <span className="fill" style={{ width: `${levelPct}%` }} />
              </div>
              <span className="pf-level-cap">
                {xpToNext} XP to Level {level + 1}
              </span>
            </div>
          </div>
        </header>

        {/* ── Stat grid (2×2) ── */}
        <div className="pf-stats">
          <div className="pf-stat">
            <span className="pf-stat-ic streak">
              <Flame weight="fill" />
            </span>
            <span className="pf-stat-text">
              <span className="pf-stat-v">{streak}</span>
              <span className="pf-stat-k">Day streak</span>
            </span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-ic xp">
              <Lightning weight="fill" />
            </span>
            <span className="pf-stat-text">
              <span className="pf-stat-v">{totalXp.toLocaleString('en-US')}</span>
              <span className="pf-stat-k">Total XP</span>
            </span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-ic lessons">
              <BookOpen weight="fill" />
            </span>
            <span className="pf-stat-text">
              <span className="pf-stat-v">{lessonsDone}</span>
              <span className="pf-stat-k">Lessons</span>
            </span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-ic medals">
              <MedalIcon weight="fill" />
            </span>
            <span className="pf-stat-text">
              <span className="pf-stat-v">{earnedCount}</span>
              <span className="pf-stat-k">Medals</span>
            </span>
          </div>
        </div>

        {/* ── Daily goal ── */}
        <div className="prof-c">
          <div className="c-h">
            <span className="ttl">Daily goal</span>
            <span className="sub">
              {todayXp} / {dailyGoal} XP
            </span>
          </div>
          <div className="prof-goal-bar">
            <div className="fill" style={{ width: `${goalPct}%` }} />
          </div>
          <DailyGoalPicker current={dailyGoal} />
        </div>

        {/* ── This week ── */}
        <div className="prof-c">
          <div className="c-h">
            <span className="ttl">This week</span>
            <span className="sub inline-flex items-center gap-1 text-streak-ink">
              <Flame weight="fill" className="text-streak" /> {weekDoneCount} days
            </span>
          </div>
          <div className="prof-week">
            {week.map((d, i) => (
              <div key={i} className={cn('prof-day', d.state)}>
                <span className="lbl">{d.lbl}</span>
                <span className="dot">
                  {d.kind === 'done' ? (
                    <Check weight="bold" />
                  ) : d.kind === 'today' ? (
                    d.xp
                  ) : (
                    '·'
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Achievements ── */}
        <div className="prof-c">
          <div className="c-h">
            <span className="ttl">Achievements</span>
            <span className="ach-right">
              <button type="button" className="see-all cursor-pointer border-0 bg-transparent">
                See all ›
              </button>
              <span className="sub">
                {earnedCount} of {totalMedals}
              </span>
            </span>
          </div>
          <MedalAcknowledger hasRecently={hasRecently}>
            <div className="prof-ach-row">
              {medals.map((m) => (
                <div key={m.key} className="prof-ach-cell">
                  <Medal type={m.key} state={m.state} progress={m.progress} size={64} label={m.name} />
                </div>
              ))}
            </div>
          </MedalAcknowledger>
        </div>
      </div>
    </div>
  );
}
