import type { CSSProperties, ReactNode } from 'react';
import type { LessonKind } from '@prisma/client';
import { BookOpen, Flame, Lightning } from '@phosphor-icons/react/dist/ssr';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui';
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

// Decorative garden art (verbatim from the styleguide #bg-* defs + positions).
const cloudArt = (
  <>
    <ellipse cx="22" cy="22" rx="14" ry="9" fill="#FFFFFF" />
    <ellipse cx="50" cy="16" rx="22" ry="13" fill="#FFFFFF" />
    <ellipse cx="78" cy="22" rx="18" ry="10" fill="#FFFFFF" />
    <ellipse cx="34" cy="14" rx="9" ry="6" fill="#FFFFFF" opacity="0.7" />
  </>
);
const flowerArt = (
  <>
    <circle cx="8" cy="3" r="2" fill="#FFFFFF" />
    <circle cx="13" cy="8" r="2" fill="#FFFFFF" />
    <circle cx="8" cy="13" r="2" fill="#FFFFFF" />
    <circle cx="3" cy="8" r="2" fill="#FFFFFF" />
    <circle cx="8" cy="8" r="2.3" fill="#FFB459" />
  </>
);
const sparkArt = (
  <path
    d="M 7 1 V 13 M 1 7 H 13 M 2.5 2.5 L 11.5 11.5 M 11.5 2.5 L 2.5 11.5"
    stroke="#E8A82A"
    strokeWidth="1.4"
    strokeLinecap="round"
    opacity="0.55"
  />
);

const DECOR: Array<{ cls: string; viewBox: string; art: ReactNode; style: CSSProperties }> = [
  {
    cls: 'bg-cloud',
    viewBox: '0 0 100 36',
    art: cloudArt,
    style: { top: 46, left: -22, width: 110, height: 38 },
  },
  {
    cls: 'bg-cloud',
    viewBox: '0 0 100 36',
    art: cloudArt,
    style: { top: 360, right: -18, width: 96, height: 34 },
  },
  {
    cls: 'bg-cloud',
    viewBox: '0 0 100 36',
    art: cloudArt,
    style: { top: 720, left: -26, width: 104, height: 36 },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 16 16',
    art: flowerArt,
    style: { top: 160, right: 34, width: 14, height: 14 },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 16 16',
    art: flowerArt,
    style: { top: 455, left: 22, width: 12, height: 12 },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 16 16',
    art: flowerArt,
    style: { top: 680, right: 50, width: 14, height: 14 },
  },
  {
    cls: 'bg-flower',
    viewBox: '0 0 16 16',
    art: flowerArt,
    style: { top: 880, left: 40, width: 12, height: 12 },
  },
  {
    cls: 'bg-spark',
    viewBox: '0 0 14 14',
    art: sparkArt,
    style: { top: 240, left: 30, width: 10, height: 10 },
  },
  {
    cls: 'bg-spark',
    viewBox: '0 0 14 14',
    art: sparkArt,
    style: { top: 570, right: 24, width: 11, height: 11 },
  },
  {
    cls: 'bg-spark',
    viewBox: '0 0 14 14',
    art: sparkArt,
    style: { top: 820, left: 60, width: 9, height: 9 },
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
  const activeUnitTitle = units.find((u) => !u.comingSoon)?.title ?? 'Tooti';

  return (
    <div className="scr-path en flex flex-1 flex-col" dir="ltr">
      <div className="path-topbar en">
        <span className="unit-pill">
          <BookOpen weight="bold" />
          {activeUnitTitle}
        </span>
        <div className="stats">
          <Badge variant="streak" size="sm" icon={<Flame weight="fill" />} value={streak} />
          <Badge variant="xp" size="sm" icon={<Lightning weight="fill" />} value={totalXp} />
        </div>
      </div>

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
