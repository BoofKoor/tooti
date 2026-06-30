'use client';

import { useRouter } from 'next/navigation';
import {
  Barbell,
  BookOpen,
  ChatCircleText,
  Check,
  Lock,
  Trophy,
} from '@phosphor-icons/react/dist/ssr';
import { Mascot, useToast } from '@/components/ui';
import { cn } from '@/lib/utils';

/*
 * Client island for the Learn path nodes — the server page computes every
 * position/state from the DB and this island only renders the `.nodes` layer
 * and handles clicks. Markup/classes are verbatim from the Phase 2 mock.
 */

export type PathGlyph = 'lesson' | 'story' | 'review' | 'test' | 'soon';
export type PathNodeState = 'done' | 'current' | 'locked';

export type PathNodeView = {
  key: string;
  label: string;
  glyph: PathGlyph;
  state: PathNodeState;
  boss: boolean;
  crown: number | null;
  top: number;
  left: number;
  href: string | null;
};

export type PathHeaderView = { label: string; top: number };

export type CurrentCompanions = {
  pill: { top: number; left: number };
  tooti: { top: number; left: number };
  label: { top: number; left: number; text: string };
} | null;

// Literal class map so Tailwind keeps the @layer components state rules.
const STATE_CLASS: Record<PathNodeState, string> = {
  done: 'done',
  current: 'current',
  locked: 'locked',
};

function nodeGlyph(node: PathNodeView) {
  // Completed nodes read as "done" with a check (styleguide), regardless of kind;
  // locked nodes show a lock. Only available/current nodes carry the lesson-type
  // glyph so the next step's nature (lesson vs review vs boss) stays legible.
  if (node.state === 'done') return <Check size={node.boss ? 36 : 32} weight="bold" />;
  if (node.state === 'locked') return <Lock size={node.boss ? 30 : 28} weight="fill" />;
  switch (node.glyph) {
    case 'lesson':
      return <BookOpen size={node.state === 'current' ? 38 : 32} weight="fill" />;
    case 'story':
      return <ChatCircleText size={node.state === 'current' ? 38 : 32} weight="fill" />;
    case 'review':
      return <Barbell size={node.state === 'current' ? 38 : 32} weight="fill" />;
    case 'test':
      return <Trophy size={34} weight="fill" />;
    case 'soon':
      return <Lock size={28} weight="fill" />;
  }
}

export function PathNodes({
  height,
  headers,
  nodes,
  current,
}: {
  height: number;
  headers: PathHeaderView[];
  nodes: PathNodeView[];
  current: CurrentCompanions;
}) {
  const router = useRouter();
  const push = useToast();

  return (
    <div className="nodes" style={{ height }}>
      {headers.map((s) => (
        <div key={s.label} className="path-section-header" style={{ top: s.top }}>
          {s.label}
        </div>
      ))}

      {current ? (
        <>
          <span
            className="path-start-pill en"
            style={{ top: current.pill.top, left: current.pill.left }}
          >
            START
          </span>
          <div
            className="tooti-on-node"
            style={{ top: current.tooti.top, left: current.tooti.left }}
          >
            <Mascot pose="encourage" />
          </div>
          <span
            className="path-current-label en"
            style={{ top: current.label.top, left: current.label.left }}
          >
            {current.label.text}
          </span>
        </>
      ) : null}

      {nodes.map((node) => {
        const clickable = node.href != null && node.state !== 'locked';
        // Locked/soon nodes stay tappable (just not navigable) so a tap explains
        // why — a silent dead button reads as broken. aria-disabled conveys the
        // unavailable state to assistive tech without removing the affordance.
        const onNode = () => {
          if (clickable) {
            router.push(node.href as string);
            return;
          }
          push(
            node.glyph === 'soon'
              ? {
                  type: 'info',
                  title: 'Coming soon',
                  sub: 'This topic isn’t available yet.',
                  icon: <Lock weight="fill" />,
                }
              : {
                  type: 'info',
                  title: 'Locked for now',
                  sub: 'Finish the earlier steps to unlock this.',
                  icon: <Lock weight="fill" />,
                },
          );
        };
        return (
          <button
            key={node.key}
            type="button"
            className={cn('path-node-v2', node.boss && 'boss', STATE_CLASS[node.state])}
            style={{ top: node.top, left: node.left }}
            aria-disabled={!clickable || undefined}
            aria-label={node.label}
            onClick={onNode}
          >
            {nodeGlyph(node)}
            {node.crown != null ? <span className="pn-crown">{node.crown}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
