'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SectionKind } from '@prisma/client';
import { ArrowSquareOut, Play, X } from '@phosphor-icons/react/dist/ssr';
import { Button, Card, Mascot, Text } from '@/components/ui';
import { shuffledOrder } from '@/lib/gamification';
import type { SectionContent } from '@/lib/lesson-content';
import { fa } from '@/lib/i18n/fa';
import { cn } from '@/lib/utils';
import { ContinueButton } from './_continue-button';

/*
 * Learn-stage reader (Phase 5B) — a paged, runner-style experience: one section
 * per screen under the runner's lesson-bar shell (no hearts; reading is safe).
 * Section content follows the lib/lesson-content contract; Persian appears only
 * in the sanctioned islands (titleFa / bodyFa / example fa+note / explanations)
 * via the `fa` Text variant. All state is client-side; nothing persists
 * mid-read, and the final page reuses the Phase 5A completion island.
 */

export type ReaderSection = {
  kind: SectionKind;
  titleEn: string;
  titleFa: string;
  content: SectionContent;
};

// Per-section micro-check state; entries persist across Back/Continue so an
// answered check stays answered (the gate doesn't re-lock on revisit).
type CheckState = { order: number[]; selected: number | null; checked: boolean };

/** `**…**` spans mark grammar highlights in READING paragraphs. */
function highlightSpans(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="hl-grammar">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Host-agnostic embed URL; YouTube watch/short links get the no-cookie embed host. */
function videoEmbedUrl(url: string): string {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([\w-]+)/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : url;
}

function SectionHeader({ titleEn, titleFa }: { titleEn: string; titleFa: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Text variant="section" as="h2">
        {titleEn}
      </Text>
      <Text variant="caption" fa className="text-text-2">
        {titleFa}
      </Text>
    </div>
  );
}

export function StudyReader({
  slug,
  unitTitle,
  completed,
  sections,
  firstCheckOrder,
}: {
  slug: string;
  unitTitle: string;
  completed: boolean;
  sections: ReaderSection[];
  /** Server-shuffled option order for section 1's check (keeps SSR + hydration in sync). */
  firstCheckOrder: number[] | null;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [checks, setChecks] = useState<Record<number, CheckState>>(
    (): Record<number, CheckState> => {
      if (!firstCheckOrder) return {};
      return { 0: { order: firstCheckOrder, selected: null, checked: false } };
    },
  );

  const total = Math.max(sections.length, 1);
  const section = sections[index] ?? null;
  const check = section?.content.check ?? null;
  const cs = checks[index] ?? null;
  const gated = !!check && !cs?.checked;
  const isLast = index >= total - 1;
  const checkCorrect =
    !!check &&
    !!cs &&
    cs.checked &&
    cs.selected !== null &&
    cs.order[cs.selected] === check.correctIndex;

  function goTo(i: number) {
    setChecks((m) => {
      const c = sections[i]?.content.check;
      if (!c || m[i]) return m;
      return {
        ...m,
        [i]: { order: shuffledOrder(c.options.length), selected: null, checked: false },
      };
    });
    setVideoLoaded(false); // click-to-load on every visit — never auto-load
    setIndex(i);
  }

  function selectCheckOption(display: number) {
    setChecks((m) => ({ ...m, [index]: { ...m[index], selected: display } }));
  }

  function confirmCheck() {
    setChecks((m) =>
      m[index]?.selected === null ? m : { ...m, [index]: { ...m[index], checked: true } },
    );
  }

  // Literal class strings so Tailwind keeps the @layer components state rules.
  function checkTileClass(display: number): string {
    if (!check || !cs) return '';
    if (!cs.checked) return display === cs.selected ? 'is-selected' : '';
    if (cs.order[display] === check.correctIndex) return 'is-correct';
    if (display === cs.selected) return 'is-incorrect';
    return '';
  }

  function sectionBody(s: ReaderSection) {
    const c = s.content;
    switch (s.kind) {
      case 'READING':
        return (
          <div className="flex flex-col gap-4">
            {(c.paragraphs ?? []).map((p, i) => (
              <Text key={i} variant="body" className="leading-relaxed">
                {highlightSpans(p)}
              </Text>
            ))}
          </div>
        );
      case 'CONCEPT':
        return (
          <div className="flex flex-col gap-4">
            {c.bodyFa ? (
              <Card padding="sm" shadow={1}>
                <Text variant="body" fa>
                  {c.bodyFa}
                </Text>
              </Card>
            ) : null}
            {c.examples?.length ? (
              <Card className="flex flex-col">
                {c.examples.map((ex) => (
                  <div
                    key={ex.en}
                    className="flex flex-col gap-1 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <Text variant="body" className="font-bold">
                      {ex.en}
                    </Text>
                    {ex.fa ? (
                      <Text variant="body" fa className="text-text-2">
                        {ex.fa}
                      </Text>
                    ) : null}
                    {ex.note ? (
                      <Text variant="caption" fa className="text-text-3">
                        {ex.note}
                      </Text>
                    ) : null}
                  </div>
                ))}
              </Card>
            ) : null}
          </div>
        );
      case 'SUMMARY':
        return (
          <Card className="flex flex-col">
            {(c.recap ?? []).map((row) => (
              <div
                key={row.labelFa}
                className="flex flex-col gap-1 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <Text variant="caption" fa className="text-text-2">
                  {row.labelFa}
                </Text>
                <Text variant="body" className="font-bold">
                  {row.en}
                </Text>
              </div>
            ))}
          </Card>
        );
      case 'VIDEO': {
        if (!c.url) return null; // the server filters these out; belt and braces
        return (
          <div className="flex flex-col gap-4">
            {c.noteFa ? (
              <Text variant="body" fa className="text-text-2">
                {c.noteFa}
              </Text>
            ) : null}
            {videoLoaded ? (
              <iframe
                src={videoEmbedUrl(c.url)}
                title={s.titleEn}
                loading="lazy"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full rounded-xl border border-border bg-surface-2"
              />
            ) : (
              <button
                type="button"
                onClick={() => setVideoLoaded(true)}
                className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-surface-2 text-text-2 transition-colors hover:border-border-strong hover:text-text-1"
              >
                <span className="grid h-16 w-16 place-items-center rounded-pill bg-primary text-text-inverse shadow-2">
                  <Play size={28} weight="fill" />
                </span>
                <span className="text-sm font-extrabold">Load video</span>
              </button>
            )}
            <div className="flex flex-col gap-1">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary-ink"
              >
                Open in a new tab <ArrowSquareOut weight="bold" />
              </a>
              <Text variant="caption" fa className="text-text-3">
                {fa.study.videoFallback}
              </Text>
            </div>
          </div>
        );
      }
    }
  }

  const progressPct = (Math.min(index + 1, total) / total) * 100;

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
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <span className="progress-label">
            {Math.min(index + 1, total)}/{total}
          </span>
        </div>
        <div className="lb-stats">
          <span className="text-xs font-extrabold text-text-2">{unitTitle}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <article className="ex-stage flex flex-col gap-5" dir="ltr">
          {section ? (
            <>
              <SectionHeader titleEn={section.titleEn} titleFa={section.titleFa} />
              {sectionBody(section)}

              {check && cs ? (
                <div className="flex flex-col gap-3">
                  <Text variant="caption" className="uppercase tracking-wider text-text-3">
                    Quick check
                  </Text>
                  <div className="ex-prompt">{check.prompt}</div>
                  <div className="mcq-grid">
                    {cs.order.map((orig, display) => (
                      <button
                        key={display}
                        type="button"
                        className={cn('mcq-tile', checkTileClass(display))}
                        disabled={cs.checked}
                        aria-pressed={cs.selected === display}
                        onClick={() => selectCheckOption(display)}
                      >
                        <span className="mcq-num">{display + 1}</span>
                        <span className="mcq-state-ic" aria-hidden="true" />
                        <span className="mcq-label-en">{check.options[orig]}</span>
                      </button>
                    ))}
                  </div>
                  {!cs.checked ? (
                    <Button
                      variant="confirm"
                      size="md"
                      className="w-full"
                      disabled={cs.selected === null}
                      onClick={confirmCheck}
                    >
                      Check
                    </Button>
                  ) : (
                    <div className={cn('fb-banner', checkCorrect ? 'fb-correct' : 'fb-incorrect')}>
                      <div className="fb-mascot">
                        <Mascot pose={checkCorrect ? 'celebrate' : 'reassure'} />
                      </div>
                      <div className="fb-text">
                        <div className="fb-title en">{checkCorrect ? 'Nice!' : 'Not quite'}</div>
                        {!checkCorrect ? (
                          <div className="fb-correct-line">
                            Correct:{' '}
                            <bdi>
                              <b>{check.options[check.correctIndex]}</b>
                            </bdi>
                          </div>
                        ) : null}
                        <div className="fb-explain fa" dir="rtl">
                          {check.explanationFa}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </article>
      </div>

      <div className="shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          {index > 0 ? (
            <Button variant="secondary" size="lg" onClick={() => goTo(index - 1)}>
              Back
            </Button>
          ) : null}
          {isLast && !gated ? (
            <div className="min-w-0 flex-1">
              <ContinueButton slug={slug} completed={completed} />
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="min-w-0 flex-1"
              disabled={gated}
              onClick={() => goTo(index + 1)}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
