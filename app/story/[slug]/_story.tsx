'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpeakerHigh, X } from '@phosphor-icons/react/dist/ssr';
import { Button, ConfirmDialog, Text } from '@/components/ui';
import type { StoryStep, StoryTone } from '@/lib/lesson-content';
import { useSpeech, type SpeakOptions } from '@/lib/use-speech';
import { cn } from '@/lib/utils';
import { StoryCompleteButton } from './_complete-button';

/*
 * Story player (LessonKind.STORY) — a paged narrative under the lesson-bar shell.
 * Content is grouped into PAGES (the `page` field): the learner taps Continue to
 * move between them, and each page shows all its content at once. Playback is
 * OPTIONAL via one "Listen" button per page — it plays the page's lines in order
 * (Tom's pre-recorded male clips + the browser-TTS lines) with a standard pause
 * between speakers. The closing narration is shown as text but kept silent
 * (`noAudio`). Persian only appears in sanctioned islands (line `fa` subtitles).
 */

type LineStep = Extract<StoryStep, { kind: 'line' }>;
type ImageStep = Extract<StoryStep, { kind: 'image' }>;
type PlayItem = { audio: string } | { text: string; opts: SpeakOptions };

const PAUSE_MS = 700; // standard gap between spoken lines so it doesn't feel rushed

/** `**…**` spans mark grammar highlights inside a line. */
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

/** Drop the highlight markers before a line is spoken aloud. */
const stripMarks = (text: string) => text.replace(/\*\*/g, '');

/** A man's voice and a boy's voice, at a slower learner rate: the coach (tone a)
 *  reads on the deeper voice, low pitch; the boy (tone b) on a lighter voice,
 *  pitched up; narration stays neutral. (Tom's lines carry recorded audio and
 *  bypass TTS entirely; this only shapes the TTS lines.) */
function voiceForTone(tone: StoryTone): SpeakOptions {
  if (tone === 'a') return { rate: 0.85, pitch: 0.95, character: 'man' };
  if (tone === 'b') return { rate: 0.92, pitch: 1.5, character: 'boy' };
  return { rate: 0.85, character: 'narrator' };
}

function StoryImage({ step }: { step: ImageStep }) {
  return (
    <figure className="story-illus">
      {/* A static scene photo (not the app's optimized art pipeline). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={step.src} alt={step.alt} loading="lazy" />
      {step.fa ? (
        <figcaption className="fa" dir="rtl">
          {step.fa}
        </figcaption>
      ) : null}
    </figure>
  );
}

function LineBubble({ step }: { step: LineStep }) {
  return (
    <div className={cn('story-line', `tone-${step.tone}`)}>
      {step.speaker ? <span className="story-speaker">{step.speaker}</span> : null}
      <div className="story-bubble">
        <p className="story-en en">{highlightSpans(step.en)}</p>
        {step.fa ? (
          <p className="story-fa fa" dir="rtl">
            {step.fa}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function StoryPlayer({
  slug,
  unitTitle,
  completed,
  titleEn,
  titleFa,
  steps,
}: {
  slug: string;
  unitTitle: string;
  completed: boolean;
  titleEn: string;
  titleFa: string;
  steps: StoryStep[];
}) {
  const router = useRouter();
  const { speak, cancel: cancelSpeech } = useSpeech();
  const [page, setPage] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  // Page list (in order); the current page's steps render together.
  const pageNums = useMemo(
    () => Array.from(new Set(steps.map((s) => s.page ?? 0))).sort((a, b) => a - b),
    [steps],
  );
  const totalPages = Math.max(pageNums.length, 1);
  const currentPageNum = pageNums[page] ?? 0;
  const pageSteps = useMemo(
    () => steps.filter((s) => (s.page ?? 0) === currentPageNum),
    [steps, currentPageNum],
  );
  const isLastPage = page >= totalPages - 1;
  // Lines on this page that the Listen button plays (closing narration is silent).
  const playable = useMemo(
    () => pageSteps.filter((s): s is LineStep => s.kind === 'line' && !s.noAudio),
    [pageSteps],
  );

  const stopPlayback = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
  }, []);

  // Play the page's lines in order — recorded clips and TTS chained on completion,
  // with a standard pause between each so the two speakers don't run together.
  function playPage() {
    stopPlayback();
    const items: PlayItem[] = playable.map((s) =>
      s.audio ? { audio: s.audio } : { text: stripMarks(s.en), opts: voiceForTone(s.tone) },
    );
    if (items.length === 0) return;

    let i = 0;
    let stopped = false;
    let audio: HTMLAudioElement | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setPlaying(true);

    const next = () => {
      if (stopped) return;
      if (i >= items.length) {
        setPlaying(false);
        stopRef.current = null;
        return;
      }
      const item = items[i++];
      const after = () => {
        if (!stopped) timer = setTimeout(next, PAUSE_MS);
      };
      if ('audio' in item) {
        audio = new Audio(item.audio);
        audio.onended = after;
        audio.onerror = after;
        void audio.play().catch(after);
      } else {
        speak(item.text, { ...item.opts, onEnd: after });
      }
    };

    stopRef.current = () => {
      stopped = true;
      audio?.pause();
      cancelSpeech();
      if (timer) clearTimeout(timer);
    };
    next();
  }

  // Changing page (Continue) stops playback and resets scroll; unmount stops too.
  useEffect(() => {
    stopPlayback();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [page, stopPlayback]);
  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const progressPct = ((page + 1) / totalPages) * 100;

  return (
    <div className="scr-lesson h-dvh" dir="ltr">
      <div className="lesson-bar">
        <button
          type="button"
          className="close"
          aria-label="Close story"
          onClick={() => (page > 0 ? setConfirmExit(true) : router.push('/learn'))}
        >
          <X weight="bold" />
        </button>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <span className="progress-label">
            {page + 1}/{totalPages}
          </span>
        </div>
        <div className="lb-stats">
          <span className="text-xs font-extrabold text-text-2">{unitTitle}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <article className="story-stage" dir="ltr">
          <header className="story-head">
            <Text variant="section" as="h1">
              {titleEn}
            </Text>
            {titleFa ? (
              <Text variant="caption" fa className="text-text-2">
                {titleFa}
              </Text>
            ) : null}
          </header>

          {playable.length > 0 ? (
            <button
              type="button"
              className={cn('story-listen', playing && 'is-playing')}
              aria-pressed={playing}
              onClick={() => (playing ? stopPlayback() : playPage())}
            >
              <SpeakerHigh weight="fill" />
              {playing ? 'Stop' : 'Listen'}
            </button>
          ) : null}

          {pageSteps.map((step, i) => {
            if (step.kind === 'line') return <LineBubble key={i} step={step} />;
            if (step.kind === 'image') return <StoryImage key={i} step={step} />;
            return null;
          })}
        </article>
      </div>

      <div className="lesson-foot shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        {isLastPage ? (
          <StoryCompleteButton slug={slug} completed={completed} />
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setPage((p) => p + 1)}
          >
            Continue
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmExit}
        title="Leave the story?"
        body="You'll start this story from the beginning next time."
        confirmLabel="Leave"
        cancelLabel="Keep reading"
        onConfirm={() => router.push('/learn')}
        onCancel={() => setConfirmExit(false)}
      />
    </div>
  );
}
