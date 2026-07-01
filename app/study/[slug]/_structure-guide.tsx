'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react/dist/ssr';
import type { FormulaToken, StructureGuide as StructureGuideContent } from '@/lib/lesson-content';
import { cn } from '@/lib/utils';
import { ContinueButton } from './_continue-button';

/*
 * Structure stage (Stage 3 of Present Simple) — a single scrollable reference of
 * sentence patterns under the lesson-bar shell. No paging, no hearts. Each group
 * (affirmative / negative / interrogative) carries a coloured polarity badge and
 * a green title; each person-block shows a colour-coded formula of grammar bricks
 * plus worked examples. In the examples, <b> marks the verb, <i> a "Short answer"
 * and <u> a "Long answer" — both rendered as a braced, labelled span.
 */

const BRICK_CLASS: Record<FormulaToken['kind'], string> = {
  subject: 'brick brick-subject',
  verb: 'brick brick-verb',
  aux: 'brick brick-aux',
  suffix: 'brick brick-suffix',
  plain: 'struct-conn',
};

const POLARITY_CLASS = { '+': 'pol-plus', '-': 'pol-minus', '?': 'pol-quest' } as const;

type Seg = { text: string; kind: 'plain' | 'bold' | 'short' | 'long' };

/** Expand the light <b>/<i>/<u> markup into typed segments (tags don't nest). */
function parseExample(s: string): Seg[] {
  const segs: Seg[] = [];
  const re = /<(b|i|u)>(.*?)<\/\1>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) segs.push({ text: s.slice(last, m.index), kind: 'plain' });
    segs.push({ text: m[2], kind: m[1] === 'b' ? 'bold' : m[1] === 'i' ? 'short' : 'long' });
    last = re.lastIndex;
  }
  if (last < s.length) segs.push({ text: s.slice(last), kind: 'plain' });
  return segs;
}

function ExampleLine({ text }: { text: string }) {
  return (
    <li className="struct-ex">
      {parseExample(text).map((seg, i) => {
        if (seg.kind === 'bold') return <strong key={i} className="struct-verb">{seg.text}</strong>;
        if (seg.kind === 'short' || seg.kind === 'long') {
          const ann = (
            <span
              className={cn('struct-ann', seg.kind === 'short' ? 'ann-short' : 'ann-long')}
              data-label={seg.kind === 'short' ? 'Short answer' : 'Long answer'}
            >
              {seg.text}
            </span>
          );
          // The long answer starts on its own line so its braced label never
          // collides with the short-answer label sitting on the same row.
          return seg.kind === 'long' && i > 0 ? (
            <Fragment key={i}>
              <br />
              {ann}
            </Fragment>
          ) : (
            <Fragment key={i}>{ann}</Fragment>
          );
        }
        return <Fragment key={i}>{seg.text}</Fragment>;
      })}
    </li>
  );
}

export function StructureGuide({
  slug,
  unitTitle,
  completed,
  guide,
}: {
  slug: string;
  unitTitle: string;
  completed: boolean;
  guide: StructureGuideContent;
}) {
  const router = useRouter();

  return (
    <div className="scr-lesson h-dvh" dir="ltr">
      <div className="lesson-bar">
        <button
          type="button"
          className="close"
          aria-label="Close lesson"
          onClick={() => router.push('/learn')}
        >
          <X weight="bold" />
        </button>
        <div className="progress">
          <div className="progress-fill" style={{ width: '100%' }} />
        </div>
        <div className="lb-stats">
          <span className="text-xs font-extrabold text-text-2">{unitTitle}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <article className="struct-guide" dir="ltr">
          <h1 className="struct-heading">{guide.heading}</h1>

          {guide.groups.map((group) => (
            <section key={group.title} className="struct-group">
              <header className="struct-group-head">
                <span className={cn('struct-badge', POLARITY_CLASS[group.polarity])} aria-hidden="true">
                  {group.polarity}
                </span>
                <h2 className="struct-title">{group.title}</h2>
              </header>

              {group.blocks.map((block) => (
                <div key={block.person} className="struct-block">
                  <span className="struct-person">{block.person}</span>
                  <div className="struct-formula" aria-label={`Pattern: ${block.formula.map((t) => t.text).join(' ')}`}>
                    {block.formula.map((tok, i) => (
                      <span key={i} className={BRICK_CLASS[tok.kind]}>
                        {tok.text}
                      </span>
                    ))}
                  </div>
                  <p className="struct-ex-label">Examples:</p>
                  <ul className="struct-examples">
                    {block.examples.map((ex, i) => (
                      <ExampleLine key={i} text={ex} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </article>
      </div>

      <div className="lesson-foot shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        <ContinueButton slug={slug} completed={completed} />
      </div>
    </div>
  );
}
