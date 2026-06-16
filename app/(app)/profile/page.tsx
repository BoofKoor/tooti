import { Flame, Lightning, Medal as MedalIcon } from '@phosphor-icons/react/dist/ssr';
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
 * Profile — real data, English / LTR. Inside the (app) shell (TabBar provided by
 * the layout). Styling is the verbatim .prof CSS in globals.css (@layer
 * components); the markup is unchanged from the mock — only the numbers are now
 * fetched + derived from the DB. Request-time only (auth + Prisma) → dynamic.
 */

const FALLBACK_TZ = 'Asia/Tehran';
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

  const [user, progress, dailyXp, catalog, userMedals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.progress.findUnique({ where: { userId } }),
    prisma.dailyXp.findMany({ where: { userId }, select: { day: true, xp: true } }),
    prisma.medal.findMany({ orderBy: { order: 'asc' } }),
    prisma.userMedal.findMany({ where: { userId } }),
  ]);

  const tz = progress?.timezone ?? FALLBACK_TZ;
  const dailyGoal = progress?.dailyGoal ?? DEFAULT_DAILY_GOAL;
  const totalXp = progress?.xp ?? 0;
  const today = localDay(new Date(), tz);
  const lastActiveDay = progress?.lastActiveDate ? localDay(progress.lastActiveDate, tz) : null;
  const streak = effectiveStreak(progress?.streak ?? 0, lastActiveDay, today);

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
      dot: done ? '✓' : isToday ? String(xp) : '—',
    };
  });
  const weekDoneCount = week.filter((d) => d.dot === '✓').length;

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
      <div className="prof-topbar">
        <ProfileActions currentName={displayName} />
      </div>

      <div className="prof-scroll">
        <div className="prof-hero-v2">
          <div className="prof-avatar is-static">
            <Mascot pose="encourage" />
            <span className="edit-pip">✎</span>
          </div>
          <h2 className="prof-name en">{displayName}</h2>
          <div className="prof-handle">
            {handle} · {daysWithTooti} {daysWithTooti === 1 ? 'day' : 'days'} with Tooti
          </div>
        </div>

        <div className="prof-stats-v2">
          <div className="prof-stat-v2 is-static">
            <div className="ic streak">
              <Flame weight="fill" />
            </div>
            <div className="v">{streak}</div>
            <div className="k">Day streak</div>
          </div>
          <div className="prof-stat-v2 is-static">
            <div className="ic xp">
              <Lightning weight="fill" />
            </div>
            <div className="v compact">{totalXp.toLocaleString('en-US')}</div>
            <div className="k">Total XP</div>
          </div>
          <div className="prof-stat-v2 is-static">
            <div className="ic gem">
              <MedalIcon weight="fill" />
            </div>
            <div className="v">{earnedCount}</div>
            <div className="k">Medals</div>
          </div>
        </div>

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
                <span className="dot">{d.dot}</span>
              </div>
            ))}
          </div>
        </div>

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
