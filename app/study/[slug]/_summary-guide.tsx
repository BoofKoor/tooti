'use client';

import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react/dist/ssr';
import type { SummaryEntry, SummaryGuide as SummaryGuideContent } from '@/lib/lesson-content';
import { ContinueButton } from './_continue-button';

/*
 * Summary stage (Stage 5 of Present Simple) — the end-of-unit recap under the
 * lesson-bar shell. No paging, no hearts. Green section titles hold orange-
 * labelled entries that condense the unit: uses, structure patterns, and key
 * notes. A themed illustration sits under the heading. English-only.
 */

function Illus({ src }: { src: string }) {
  return (
    <figure className="sum-illus">
      {/* Themed flat illustration; decorative (the text carries the meaning). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" />
    </figure>
  );
}

function Entry({ entry }: { entry: SummaryEntry }) {
  return (
    <div className="sum-entry">
      <h3 className="sum-label">{entry.label}</h3>

      {entry.pattern ? <span className="sum-pattern">{entry.pattern}</span> : null}

      {entry.chips?.length ? (
        <div className="sum-chips">
          {entry.chips.map((c) => (
            <span key={c} className="sum-chip">
              {c}
            </span>
          ))}
        </div>
      ) : null}

      {entry.transforms?.length ? (
        <ul className="sum-transforms">
          {entry.transforms.map((t, i) => (
            <li key={i}>
              <span className="tf-from">{t.from}</span>
              <span className="sr-only"> becomes </span>
              <span className="tf-arrow" aria-hidden="true">
                →
              </span>
              <span className="tf-to">{t.to}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {entry.rows?.length ? (
        <ul className="sum-rows">
          {entry.rows.map((r, i) => (
            <li key={i} className="sum-row">
              <div className="sum-row-head">
                {r.person ? <span className="sum-person">{r.person}</span> : null}
                {r.pattern ? <span className="sum-pattern">{r.pattern}</span> : null}
              </div>
              {r.example ? <p className="sum-ex">{r.example}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {entry.examples?.length ? (
        <div className="sum-examples">
          {entry.examples.map((ex, i) => (
            <p key={i} className="sum-ex">
              {ex}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SummaryGuide({
  slug,
  unitTitle,
  completed,
  guide,
}: {
  slug: string;
  unitTitle: string;
  completed: boolean;
  guide: SummaryGuideContent;
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
        <article className="sum-guide" dir="ltr">
          <h1 className="sum-heading">{guide.heading}</h1>
          {guide.image ? <Illus src={guide.image} /> : null}

          {guide.sections.map((section) => (
            <section key={section.title} className="sum-section">
              <h2 className="sum-title">{section.title}</h2>
              {section.image ? <Illus src={section.image} /> : null}
              {section.entries.map((entry, i) => (
                <Entry key={i} entry={entry} />
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
