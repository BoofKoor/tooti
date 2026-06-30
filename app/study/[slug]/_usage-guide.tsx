'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react/dist/ssr';
import type { UsageGuide as UsageGuideContent } from '@/lib/lesson-content';
import { ContinueButton } from './_continue-button';

/*
 * Usage stage (Stage 2 of Present Simple) — a single scrollable reference screen
 * under the lesson-bar shell. No paging, no hearts: each card pairs a themed flat
 * illustration with a green title, a one-line explanation and gold-labelled
 * examples. The last cards (group: 'additional') sit below an "Additional Uses"
 * divider. English-only; the only Persian on screen is the completion island's.
 */

function UsageCardView({ card }: { card: UsageGuideContent['cards'][number] }) {
  return (
    <li className="usage-card">
      <div className="usage-illus">
        {/* Themed flat illustration (brand teal), not the app's art pipeline. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.image} alt="" aria-hidden="true" loading="lazy" />
      </div>
      <div className="usage-body">
        <h3 className="usage-title">{card.title}</h3>
        <p className="usage-explain">{card.explanation}</p>
        <p className="usage-ex-label">Examples:</p>
        <ul className="usage-examples">
          {card.examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function UsageGuide({
  slug,
  unitTitle,
  completed,
  guide,
}: {
  slug: string;
  unitTitle: string;
  completed: boolean;
  guide: UsageGuideContent;
}) {
  const router = useRouter();
  // The "Additional Uses" divider is rendered once, just before the first card
  // that belongs to that group.
  const firstAdditional = guide.cards.findIndex((c) => c.group === 'additional');

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
        <article className="usage-guide" dir="ltr">
          <h1 className="usage-heading">{guide.heading}</h1>
          <ol className="usage-list">
            {guide.cards.map((card, i) => (
              <Fragment key={card.title}>
                {i === firstAdditional ? (
                  <li className="usage-divider" aria-hidden="false">
                    <span>Additional Uses</span>
                  </li>
                ) : null}
                <UsageCardView card={card} />
              </Fragment>
            ))}
          </ol>
        </article>
      </div>

      <div className="lesson-foot shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        <ContinueButton slug={slug} completed={completed} />
      </div>
    </div>
  );
}
