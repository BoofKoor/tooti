'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Check,
  Flame,
  Lightning,
  Lock,
  Play,
  TreasureChest,
} from '@phosphor-icons/react/dist/ssr';
import { Badge, Mascot } from '@/components/ui';
import { cn } from '@/lib/utils';

/*
 * Learn path — mock data screen. The path/trail/node layout is screen artwork:
 * positions + the trail `d` use the styleguide coordinate space (the .trail and
 * .nodes share a fixed height so node `top` px == trail y). Styling is the
 * verbatim path CSS in globals.css (@layer components).
 */

const CANVAS_H = 1360;

// Trail: completed (orange) segment up to the current node + the rest (gray).
// Section 1 segments are verbatim from the styleguide; extended for section 2.
const TRAIL_DONE = 'M 78 116 Q 280 116 280 206 Q 280 296 162 358';
const TRAIL_REST =
  'M 162 358 Q 30 380 66 476 Q 130 570 276 570 Q 340 670 140 676 Q 0 700 66 786 ' +
  'Q 120 870 272 866 Q 320 950 140 1016 Q 0 1070 66 1116 Q 150 1190 272 1196';

type NodeState = 'done' | 'current' | 'locked';
type PathNode = {
  id: string;
  state: NodeState;
  top: number;
  left: number;
  label: string;
  boss?: boolean;
  crown?: number;
};

// Literal class map so Tailwind keeps the @layer components state rules.
const STATE_CLASS: Record<NodeState, string> = {
  done: 'done',
  current: 'current',
  locked: 'locked',
};

const NODES: PathNode[] = [
  { id: 'simple-present', state: 'done', top: 80, left: 42, crown: 5, label: 'Simple Present' },
  { id: 'present-cont', state: 'done', top: 170, left: 244, crown: 4, label: 'Present Continuous' },
  { id: 'present-perfect', state: 'current', top: 330, left: 118, label: 'Present Perfect' },
  {
    id: 'present-perfect-cont',
    state: 'locked',
    top: 448,
    left: 30,
    label: 'Present Perfect Cont.',
  },
  { id: 'section-test', state: 'locked', boss: true, top: 540, left: 236, label: 'Section Test' },
  { id: 'mixed-review', state: 'locked', top: 644, left: 104, label: 'Mixed Review' },
  { id: 'speaking-set', state: 'locked', top: 754, left: 30, label: 'Speaking Set' },
  { id: 'unit-story', state: 'locked', top: 834, left: 236, label: 'Unit Story' },
  // "More — coming soon" (future topics, MVP keeps them locked).
  { id: 'past-tenses', state: 'locked', top: 980, left: 104, label: 'Past Tenses' },
  { id: 'future-tenses', state: 'locked', top: 1080, left: 30, label: 'Future Tenses' },
  { id: 'vocabulary', state: 'locked', top: 1160, left: 236, label: 'Vocabulary' },
];

const SECTION_HEADERS = [
  { label: 'Present Tenses', top: 32 },
  { label: 'More — coming soon', top: 908 },
];

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

function nodeGlyph(node: PathNode) {
  if (node.boss) return <TreasureChest size={34} weight="fill" />;
  if (node.state === 'done') return <Check size={32} weight="bold" />;
  if (node.state === 'current') return <Play size={38} weight="fill" />;
  return <Lock size={28} weight="fill" />;
}

export default function LearnPage() {
  const router = useRouter();

  return (
    <div className="scr-path en flex flex-1 flex-col" dir="ltr">
      <div className="path-topbar en">
        <span className="unit-pill">
          <BookOpen weight="bold" />
          Present Tenses
        </span>
        <div className="stats">
          <Badge variant="streak" size="sm" icon={<Flame weight="fill" />} value={5} />
          <Badge variant="xp" size="sm" icon={<Lightning weight="fill" />} value={120} />
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
          viewBox={`0 0 380 ${CANVAS_H}`}
          preserveAspectRatio="none"
          style={{ height: CANVAS_H }}
          aria-hidden="true"
        >
          <path className="trail-done" d={TRAIL_DONE} />
          <path className="trail-rest" d={TRAIL_REST} />
        </svg>

        <div className="nodes" style={{ height: CANVAS_H }}>
          {SECTION_HEADERS.map((s) => (
            <div key={s.label} className="path-section-header" style={{ top: s.top }}>
              {s.label}
            </div>
          ))}

          {/* Current-node companions (one current node in this mock). */}
          <span className="path-start-pill en" style={{ top: 256, left: 158 }}>
            START
          </span>
          <div className="tooti-on-node" style={{ top: 280, left: 108 }}>
            <Mascot pose="encourage" />
          </div>
          <span className="path-current-label en" style={{ top: 430, left: 162 }}>
            Present Perfect
          </span>

          {NODES.map((node) => {
            const clickable = node.state === 'done' || node.state === 'current';
            return (
              <button
                key={node.id}
                type="button"
                className={cn('path-node-v2', node.boss && 'boss', STATE_CLASS[node.state])}
                style={{ top: node.top, left: node.left }}
                disabled={!clickable}
                aria-label={node.label}
                onClick={clickable ? () => router.push('/lesson/intro') : undefined}
              >
                {nodeGlyph(node)}
                {node.crown != null ? <span className="pn-crown">{node.crown}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
