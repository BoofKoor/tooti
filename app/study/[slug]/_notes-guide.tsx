'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react/dist/ssr';
import type { NoteBlock, NotesGuide as NotesGuideContent } from '@/lib/lesson-content';
import { ContinueButton } from './_continue-button';

/*
 * Important-Notes stage (Stage 4 of Present Simple) — a single scrollable
 * reference under the lesson-bar shell. No paging, no hearts. Each section is a
 * card with a green title and an ordered list of blocks: prose, gold-labelled
 * examples, spelling transformations ("study → studies"), a pattern box, a themed
 * illustration, or nested numbered rules. Inline <b> marks a highlighted span.
 */

/** Expand inline <b>…</b> into highlighted marks (the only inline markup here). */
function highlight(text: string) {
  return text.split(/<b>(.*?)<\/b>/g).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="note-hl">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function ExamplesLabel() {
  return <p className="notes-ex-label">Examples:</p>;
}

function Block({ block }: { block: NoteBlock }) {
  switch (block.kind) {
    case 'text':
      return <p className="notes-text">{highlight(block.text)}</p>;
    case 'examples':
      return (
        <div className="notes-ex">
          <ExamplesLabel />
          <ul className="notes-ex-list">
            {block.items.map((ex, i) => (
              <li key={i}>{highlight(ex)}</li>
            ))}
          </ul>
        </div>
      );
    case 'transforms':
      return (
        <div className="notes-ex">
          <ExamplesLabel />
          <ul className="notes-transforms">
            {block.items.map((t, i) => (
              <li key={i}>
                <span className="tf-from">{highlight(t.from)}</span>
                {/* sr-only "becomes" so the arrow's meaning isn't lost to AT. */}
                <span className="sr-only"> becomes </span>
                <span className="tf-arrow" aria-hidden="true">
                  →
                </span>
                <span className="tf-to">{t.to}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'formula':
      return (
        <div className="notes-formula">
          {block.label ? <span className="notes-formula-label">{block.label}</span> : null}
          <span className="notes-formula-text">{highlight(block.text)}</span>
        </div>
      );
    case 'image':
      return (
        <figure className="notes-illus">
          {/* Themed flat illustration (brand teal), not the app's art pipeline.
              Decorative by default (the section text carries the meaning) — an
              empty alt already marks it decorative, so no aria-hidden needed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt ?? ''} loading="lazy" />
          {block.caption ? <figcaption className="notes-caption">{block.caption}</figcaption> : null}
        </figure>
      );
    case 'steps':
      return (
        <ol className="notes-steps">
          {block.items.map((step, i) => (
            <li key={i} className="notes-step">
              <div className="notes-step-head">
                <span className="notes-step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="notes-step-title">{step.title}</h3>
              </div>
              <div className="notes-step-body">
                {step.blocks.map((b, j) => (
                  <Block key={j} block={b} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      );
    default: {
      // Exhaustive over NoteBlock — a new kind added later trips this at compile
      // time instead of silently rendering nothing.
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function NotesGuide({
  slug,
  unitTitle,
  completed,
  guide,
}: {
  slug: string;
  unitTitle: string;
  completed: boolean;
  guide: NotesGuideContent;
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
        <article className="notes-guide" dir="ltr">
          <h1 className="notes-heading">{guide.heading}</h1>
          {guide.sections.map((section) => (
            <section key={section.title} className="notes-section">
              <h2 className="notes-title">{section.title}</h2>
              {section.blocks.map((b, i) => (
                <Block key={i} block={b} />
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
