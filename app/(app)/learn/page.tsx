import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import type { LessonKind } from '@prisma/client';
import { Flame, Lightning } from '@phosphor-icons/react/dist/ssr';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Badge, Mascot } from '@/components/ui';
import { effectiveStreak, localDay } from '@/lib/gamification';
import { getLearnPath, type LearnUnit } from '@/lib/learn-data';
import { cn } from '@/lib/utils';
import {
  PathNodes,
  type CurrentCompanions,
  type PathGlyph,
  type PathHeaderView,
  type PathNodeView,
} from './_path-nodes';

/*
 * Learn path — DB-driven (Phase 5A). The trail/node/garden visuals are the
 * verbatim Phase 2 artwork (positions + the trail share the styleguide
 * coordinate space; styling is the path CSS in globals.css @layer components).
 * Only the data source changed: units/lessons/completions come from Prisma and
 * node positions are generated with the mock's spacing rhythm, extracted into
 * the named constants below.
 */

const FALLBACK_TZ = 'Asia/Tehran';

// ── Layout rhythm (extracted from the Phase 2 mock positions) ──
const TRAIL_VIEWBOX_W = 380; // styleguide coordinate-space width
const NODE_SIZE = 72; // .path-node-v2 box
const HEADER_TOP_FIRST = 32; // first section header
const HEADER_TO_NODE = 48; // first node sits this far below its section header
const SOON_HEADER_TO_NODE = 72; // mock used more air under the coming-soon header
const NODE_STEP = 110; // vertical rhythm between consecutive nodes
const NODE_TO_HEADER = 74; // next header sits this far below the previous node's top
const SOON_HEADER_CLEARANCE = 36; // extra air so the soon header clears the 72px node + its crown badge
const CANVAS_BOTTOM_PAD = 128; // air under the last node
// Zig-zag horizontal rhythm (the mock's left offsets, repeated).
const NODE_LEFTS = [42, 244, 118, 30, 236, 104];
// Current-node companions, relative to the current node's top/left (mock offsets).
const START_PILL_OFFSET = { top: -74, left: 44 };
const TOOTI_OFFSET = { top: -50, left: -10 };
const CURRENT_LABEL_OFFSET = { top: 100, left: 44 };

// Decorative "tropical canopy" art — soft clouds + Tooti-brand leaves, parrot
// feathers and berries scattered behind the trail (low-opacity, aria-hidden).
const cloudArt = (
  <>
    <ellipse cx="22" cy="22" rx="14" ry="9" fill="#FFFFFF" />
    <ellipse cx="50" cy="16" rx="22" ry="13" fill="#FFFFFF" />
    <ellipse cx="78" cy="22" rx="18" ry="10" fill="#FFFFFF" />
    <ellipse cx="34" cy="14" rx="9" ry="6" fill="#FFFFFF" opacity="0.7" />
  </>
);
const leafArt = (
  <>
    <path
      d="M22 2C9 8 3 22 6 42c4 1 10-1 15-5C33 28 33 13 22 2Z"
      fill="#9fe0d1"
      opacity="0.55"
    />
    <path
      d="M20 8C15 18 12 30 9 40"
      stroke="#4fbda7"
      strokeWidth="1.5"
      fill="none"
      opacity="0.5"
      strokeLinecap="round"
    />
  </>
);
const featherArt = (
  <>
    <path
      d="M11 1C4 9 2 22 6 38c0 0 8-7 9-19 1-8-2-14-4-18Z"
      fill="#ffb3a8"
      opacity="0.5"
    />
    <path
      d="M11 6 8 35"
      stroke="#ff8475"
      strokeWidth="1.3"
      fill="none"
      opacity="0.5"
      strokeLinecap="round"
    />
  </>
);
const berryArt = <circle cx="6" cy="6" r="4.5" fill="#ffce4d" opacity="0.55" />;

const DECOR: Array<{ cls: string; viewBox: string; art: ReactNode; style: CSSProperties }> = [
  // soft clouds (sky)
  {
    cls: 'bg-cloud',
    viewBox: '0 0 100 36',
    art: cloudArt,
    style: { top: 56, left: -24, width: 104, height: 36 },
  },
  {
    cls: 'bg-cloud',
    viewBox: '0 0 100 36',
    art: cloudArt,
    style: { top: 540, right: -20, width: 92, height: 32 },
  },
  // tropical leaves
  {
    cls: 'bg-flower',
    viewBox: '0 0 44 46',
    art: leafArt,
    style: { top: 150, right: 16, width: 40, height: 42, transform: 'rotate(8deg)' },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 44 46',
    art: leafArt,
    style: { top: 430, left: 12, width: 34, height: 36, transform: 'scaleX(-1) rotate(18deg)' },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 44 46',
    art: leafArt,
    style: { top: 815, right: 28, width: 38, height: 40, transform: 'rotate(-22deg)' },
  },
  // parrot feathers
  {
    cls: 'bg-spark',
    viewBox: '0 0 22 40',
    art: featherArt,
    style: { top: 300, left: 26, width: 20, height: 36, transform: 'rotate(20deg)' },
  },
  {
    cls: 'bg-spark',
    viewBox: '0 0 22 40',
    art: featherArt,
    style: { top: 690, left: 40, width: 18, height: 32, transform: 'rotate(-12deg)' },
  },
  // berries / dots
  {
    cls: 'bg-flower',
    viewBox: '0 0 12 12',
    art: berryArt,
    style: { top: 240, left: 62, width: 9, height: 9 },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 12 12',
    art: berryArt,
    style: { top: 600, right: 56, width: 10, height: 10 },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 12 12',
    art: berryArt,
    style: { top: 880, left: 70, width: 8, height: 8 },
  },
];

function glyphForKind(kind: LessonKind): PathGlyph {
  if (kind === 'LESSON') return 'lesson';
  if (kind === 'SECTION_TEST') return 'test';
  return 'review';
}

function hrefForKind(kind: LessonKind, slug: string): string {
  return kind === 'LESSON' ? `/study/${slug}` : `/lesson/${slug}`;
}

/** Dotted trail through node centers (midpoint-smoothed quadratic segments). */
function buildTrailD(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  const parts = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length - 1; i += 1) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    parts.push(`Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`);
  }
  const last = pts[pts.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(' ');
}

function buildLayout(units: LearnUnit[]): {
  headers: PathHeaderView[];
  nodes: PathNodeView[];
  current: CurrentCompanions;
  trailDone: string;
  trailRest: string;
  height: number;
} {
  const active = units.filter((u) => !u.comingSoon);
  const soon = units.filter((u) => u.comingSoon);

  const headers: PathHeaderView[] = [];
  const nodes: PathNodeView[] = [];
  let headerTop = HEADER_TOP_FIRST;
  let lastNodeTop = HEADER_TOP_FIRST;
  let n = 0; // global zig-zag index
  let currentAssigned = false;
  let current: CurrentCompanions = null;

  for (const unit of active) {
    if (unit.lessons.length === 0) continue;
    headers.push({ label: unit.title, top: headerTop });
    let top = headerTop + HEADER_TO_NODE;
    for (const lesson of unit.lessons) {
      const isCurrent = !currentAssigned && !lesson.completed && lesson.unlocked;
      if (isCurrent) currentAssigned = true;
      const left = NODE_LEFTS[n % NODE_LEFTS.length];
      nodes.push({
        key: lesson.slug,
        label: lesson.title,
        glyph: glyphForKind(lesson.kind),
        state: lesson.completed ? 'done' : isCurrent ? 'current' : 'locked',
        boss: lesson.kind === 'SECTION_TEST',
        crown: lesson.completed && lesson.crownLevel > 0 ? lesson.crownLevel : null,
        top,
        left,
        href: hrefForKind(lesson.kind, lesson.slug),
      });
      if (isCurrent) {
        current = {
          pill: { top: top + START_PILL_OFFSET.top, left: left + START_PILL_OFFSET.left },
          tooti: { top: top + TOOTI_OFFSET.top, left: left + TOOTI_OFFSET.left },
          label: {
            top: top + CURRENT_LABEL_OFFSET.top,
            left: left + CURRENT_LABEL_OFFSET.left,
            text: lesson.title,
          },
        };
      }
      lastNodeTop = top;
      top += NODE_STEP;
      n += 1;
    }
    headerTop = lastNodeTop + NODE_TO_HEADER;
  }

  if (soon.length > 0) {
    const soonHeaderTop = headerTop + SOON_HEADER_CLEARANCE;
    headers.push({ label: 'More — coming soon', top: soonHeaderTop });
    let top = soonHeaderTop + SOON_HEADER_TO_NODE;
    for (const unit of soon) {
      nodes.push({
        key: unit.slug,
        label: unit.title,
        glyph: 'soon',
        state: 'locked',
        boss: false,
        crown: null,
        top,
        left: NODE_LEFTS[n % NODE_LEFTS.length],
        href: null,
      });
      lastNodeTop = top;
      top += NODE_STEP;
      n += 1;
    }
  }

  // Orange "done" trail runs from the first node THROUGH the current node (or
  // through the last completed node when everything is done); gray covers the rest.
  const pts = nodes.map((nd) => ({ x: nd.left + NODE_SIZE / 2, y: nd.top + NODE_SIZE / 2 }));
  let splitIdx = nodes.findIndex((nd) => nd.state === 'current');
  if (splitIdx === -1) {
    for (let i = nodes.length - 1; i >= 0; i -= 1) {
      if (nodes[i].state === 'done') {
        splitIdx = i;
        break;
      }
    }
  }
  const trailDone = splitIdx > 0 ? buildTrailD(pts.slice(0, splitIdx + 1)) : '';
  const trailRest = buildTrailD(splitIdx >= 0 ? pts.slice(splitIdx) : pts);
  const height = lastNodeTop + NODE_SIZE + CANVAS_BOTTOM_PAD;

  return { headers, nodes, current, trailDone, trailRest, height };
}

export default async function LearnPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // the (app) layout already guards this
  const userId = session.user.id;

  const [units, progress] = await Promise.all([
    getLearnPath(userId),
    prisma.progress.findUnique({ where: { userId } }),
  ]);
  const { headers, nodes, current, trailDone, trailRest, height } = buildLayout(units);

  const tz = progress?.timezone ?? FALLBACK_TZ;
  const today = localDay(new Date(), tz);
  const lastActiveDay = progress?.lastActiveDate ? localDay(progress.lastActiveDate, tz) : null;
  const streak = effectiveStreak(progress?.streak ?? 0, lastActiveDay, today);
  const totalXp = progress?.xp ?? 0;
  const activeUnit = units.find((u) => !u.comingSoon);
  const activeUnitTitle = activeUnit?.title ?? 'Tooti';
  const unitTotal = activeUnit?.lessons.length ?? 0;
  const unitDone = activeUnit?.lessons.filter((l) => l.completed).length ?? 0;
  const unitPct = unitTotal ? Math.round((unitDone / unitTotal) * 100) : 0;

  return (
    <div className="scr-path en flex flex-1 flex-col" dir="ltr">
      <header className="path-topbar en">
        <Link href="/profile" className="path-profile" aria-label="Your profile">
          <Mascot pose="encourage" />
        </Link>
        <div className="path-unit">
          <h1 className="path-unit-title">{activeUnitTitle}</h1>
          <div className="path-unit-progress">
            <span className="path-unit-bar">
              <span className="fill" style={{ width: `${unitPct}%` }} />
            </span>
            <span className="path-unit-count">
              {unitDone} of {unitTotal} lessons
            </span>
          </div>
        </div>
        <div className="stats">
          <Badge variant="streak" size="sm" icon={<Flame weight="fill" />} value={streak} />
          <Badge variant="xp" size="sm" icon={<Lightning weight="fill" />} value={totalXp} />
        </div>
      </header>

      <div className="path-canvas">
        <div className="path-bg-decor" aria-hidden="true">
          {DECOR.map((d, i) => (
            <svg key={i} className={cn('absolute', d.cls)} style={d.style} viewBox={d.viewBox}>
              {d.art}
            </svg>
          ))}
        </div>

        <svg
          className="trail"
          viewBox={`0 0 ${TRAIL_VIEWBOX_W} ${height}`}
          preserveAspectRatio="none"
          style={{ height }}
          aria-hidden="true"
        >
          {trailDone ? <path className="trail-done" d={trailDone} /> : null}
          {trailRest ? <path className="trail-rest" d={trailRest} /> : null}
        </svg>

        <PathNodes height={height} headers={headers} nodes={nodes} current={current} />
      </div>
    </div>
  );
}
