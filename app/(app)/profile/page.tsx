import {
  Export,
  Flame,
  GearSix,
  Lightning,
  Medal as MedalIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Mascot, Medal } from '@/components/ui';
import type { MedalState, MedalType } from '@/components/ui';
import { cn } from '@/lib/utils';

/*
 * Profile — mock data, English / LTR. Inside the (app) shell, so the TabBar is
 * already provided (none added here). Styling is the verbatim .prof CSS in
 * globals.css (@layer components); achievements use the Medal component.
 */

const WEEK: Array<{ lbl: string; state: string; dot: string }> = [
  { lbl: 'S', state: 'done', dot: '✓' },
  { lbl: 'M', state: 'done', dot: '✓' },
  { lbl: 'T', state: 'done', dot: '✓' },
  { lbl: 'W', state: 'done', dot: '✓' },
  { lbl: 'T', state: 'done', dot: '✓' },
  { lbl: 'F', state: 'today', dot: '7' },
  { lbl: 'S', state: '', dot: '—' },
];

const MEDALS: Array<{ type: MedalType; state: MedalState; progress?: number; name: string }> = [
  { type: 'week-champ', state: 'earned', name: 'Week Champ' },
  { type: '500-xp', state: 'earned', name: '500 XP' },
  { type: 'perfect-lesson', state: 'earned', name: 'Perfect' },
  { type: '40-questions', state: 'in-progress', progress: 65, name: '40 Qs' },
  { type: 'hot-streak', state: 'locked', name: 'Hot Streak' },
];

export default function ProfilePage() {
  return (
    <div className="prof min-h-0 flex-1" dir="ltr">
      <div className="prof-topbar">
        <button className="prof-icon-btn" type="button" aria-label="Settings">
          <GearSix />
        </button>
        <button className="prof-icon-btn" type="button" aria-label="Share">
          <Export />
        </button>
      </div>

      <div className="prof-scroll">
        <div className="prof-hero-v2">
          <button className="prof-avatar" type="button" aria-label="Edit profile">
            <Mascot pose="encourage" />
            <span className="edit-pip">✎</span>
          </button>
          <h2 className="prof-name en">Ghazal</h2>
          <div className="prof-handle">@ghazal · 28 days with Tooti</div>
        </div>

        <div className="prof-stats-v2">
          <button className="prof-stat-v2" type="button">
            <div className="ic streak">
              <Flame weight="fill" />
            </div>
            <div className="v">7</div>
            <div className="k">Day streak</div>
          </button>
          <button className="prof-stat-v2" type="button">
            <div className="ic xp">
              <Lightning weight="fill" />
            </div>
            <div className="v compact">1,240</div>
            <div className="k">Total XP</div>
          </button>
          <button className="prof-stat-v2" type="button">
            <div className="ic gem">
              <MedalIcon weight="fill" />
            </div>
            <div className="v">6</div>
            <div className="k">Badges</div>
          </button>
        </div>

        <div className="prof-c">
          <div className="c-h">
            <span className="ttl">Daily goal</span>
            <span className="sub">20 / 30 XP</span>
          </div>
          <div className="prof-goal-bar">
            <div className="fill" style={{ width: '66%' }} />
          </div>
        </div>

        <div className="prof-c">
          <div className="c-h">
            <span className="ttl">This week</span>
            <span className="sub inline-flex items-center gap-1 text-streak-ink">
              <Flame weight="fill" className="text-streak" /> 6 days
            </span>
          </div>
          <div className="prof-week">
            {WEEK.map((d, i) => (
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
              <span className="sub">6 of 8</span>
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {MEDALS.map((m) => (
              <div key={m.type} className="flex shrink-0 flex-col items-center gap-1">
                <Medal type={m.type} state={m.state} progress={m.progress} size={56} />
                <span className="text-center text-xs font-bold text-text-2">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
