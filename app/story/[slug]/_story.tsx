'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpeakerHigh, X } from '@phosphor-icons/react/dist/ssr';
import { Button, ConfirmDialog, Mascot, Text } from '@/components/ui';
import { shuffledOrder } from '@/lib/gamification';
import type { StoryStep } from '@/lib/lesson-content';
import { useSpeech } from '@/lib/use-speech';
import { cn } from '@/lib/utils';
import { StoryCompleteButton } from './_complete-button';

/*
 * Story player (LessonKind.STORY) — a paged, runner-style narrative under the
 * lesson-bar shell. Spoken lines reveal one tap at a time (auto-spoken via
 * browser TTS, with a per-line replay button), and inline comprehension checks
 * gate progression. Checks are hearts-free (a story is never "failed") — exactly
 * like the Learn-stage micro-checks. State is client-side; the final step reuses
 * the Story completion island. Persian appears only in the sanctioned islands
 * (the title gloss, line `fa` subtitles, and the check explanation).
 *
 * Authoring contract: step 0 is always a `line`, so the first paint never has a
 * question (whose option order is shuffled client-side, which would otherwise
 * risk a hydration mismatch).
 */

type QState = { order: number[]; selected: number | null; checked: boolean };
type LineStep = Extract<StoryStep, { kind: 'line' }>;
type QuestionStep = Extract<StoryStep, { kind: 'q' }>;

function LineBubble({
  step,
  canSpeak,
  onSpeak,
}: {
  step: LineStep;
  canSpeak: boolean;
  onSpeak: () => void;
}) {
  return (
    <div className={cn('story-line', `tone-${step.tone}`)}>
      {step.speaker ? <span className="story-speaker">{step.speaker}</span> : null}
      <div className="story-bubble">
        <p className="story-en en">{step.en}</p>
        {step.fa ? (
          <p className="story-fa fa" dir="rtl">
            {step.fa}
          </p>
        ) : null}
        {canSpeak ? (
          <button type="button" className="story-say" aria-label="Play this line" onClick={onSpeak}>
            <SpeakerHigh weight="fill" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function questionTileClass(cs: QState | null, correctIndex: number, display: number): string {
  if (!cs) return '';
  if (!cs.checked) return display === cs.selected ? 'is-selected' : '';
  if (cs.order[display] === correctIndex) return 'is-correct';
  if (display === cs.selected) return 'is-incorrect';
  return '';
}

function QuestionCard({
  step,
  cs,
  onSelect,
}: {
  step: QuestionStep;
  cs: QState | null;
  onSelect: (display: number) => void;
}) {
  // Identity order until the player initializes (and shuffles) this step's state.
  const order = cs?.order ?? step.options.map((_, i) => i);
  const checked = !!cs?.checked;
  // The result banner is NOT inline here — it lives in the pinned footer so it
  // can't be occluded by the action bar. The tiles still show correct/incorrect.
  return (
    <div className="story-q">
      <Text variant="caption" className="uppercase tracking-wider text-text-3">
        Quick check
      </Text>
      <div className="ex-prompt">{step.prompt}</div>
      <div className="mcq-grid">
        {order.map((orig, display) => (
          <button
            key={display}
            type="button"
            className={cn('mcq-tile', questionTileClass(cs, step.correctIndex, display))}
            disabled={checked}
            aria-pressed={cs?.selected === display}
            onClick={() => onSelect(display)}
          >
            <span className="mcq-num">{display + 1}</span>
            <span className="mcq-state-ic" aria-hidden="true" />
            <span className="mcq-label-en">{step.options[orig]}</span>
          </button>
        ))}
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
  const total = Math.max(steps.length, 1);
  const [cursor, setCursor] = useState(0); // index of the last revealed step
  const [answers, setAnswers] = useState<Record<number, QState>>({});
  const [confirmExit, setConfirmExit] = useState(false);

  const { status: speechStatus, speak } = useSpeech();

  // Auto-speak each line as it's revealed; the ref guards re-speaks on re-render
  // (and on the late voices-resolve that flips status to ready).
  const spokenRef = useRef<number | null>(null);
  useEffect(() => {
    const step = steps[cursor];
    if (step?.kind === 'line' && speechStatus === 'ready' && spokenRef.current !== cursor) {
      spokenRef.current = cursor;
      speak(step.en);
    }
  }, [cursor, steps, speechStatus, speak]);

  const top = steps[cursor];
  const topQ = top?.kind === 'q' ? top : null;
  const topIsQuestion = topQ != null;
  const topCs = answers[cursor] ?? null;
  const needsCheck = topIsQuestion && !topCs?.checked;
  const topChecked = topIsQuestion && !!topCs?.checked;
  const topCorrect =
    !!topQ &&
    !!topCs &&
    topCs.checked &&
    topCs.selected != null &&
    topCs.order[topCs.selected] === topQ.correctIndex;
  const isLastStep = cursor >= total - 1;

  // Keep the newest content in view: each revealed step (and the feedback that
  // appears on answering a check) scrolls the conversation to the bottom, like a
  // chat — so the answered question sits just above the pinned footer panel.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [cursor, topChecked]);

  function advance() {
    const next = cursor + 1;
    if (next >= total) return;
    setAnswers((m) => {
      const step = steps[next];
      if (step.kind !== 'q' || m[next]) return m;
      return {
        ...m,
        [next]: { order: shuffledOrder(step.options.length), selected: null, checked: false },
      };
    });
    setCursor(next);
  }

  function selectOption(stepIdx: number, display: number) {
    setAnswers((m) => (m[stepIdx] ? { ...m, [stepIdx]: { ...m[stepIdx], selected: display } } : m));
  }

  function confirmCheck(stepIdx: number) {
    setAnswers((m) =>
      m[stepIdx]?.selected == null ? m : { ...m, [stepIdx]: { ...m[stepIdx], checked: true } },
    );
  }

  const canConfirm = !!topCs && topCs.selected !== null;
  const progressPct = (Math.min(cursor + 1, total) / total) * 100;

  return (
    <div className="scr-lesson h-dvh" dir="ltr">
      <div className="lesson-bar">
        <button
          type="button"
          className="close"
          aria-label="Close story"
          onClick={() => (cursor > 0 ? setConfirmExit(true) : router.push('/learn'))}
        >
          <X weight="bold" />
        </button>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <span className="progress-label">
            {Math.min(cursor + 1, total)}/{total}
          </span>
        </div>
        <div className="lb-stats">
          <span className="text-xs font-extrabold text-text-2">{unitTitle}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <article className="story-stage" dir="ltr">
          <header className="story-head">
            <Text variant="section" as="h1">
              {titleEn}
            </Text>
            <Text variant="caption" fa className="text-text-2">
              {titleFa}
            </Text>
          </header>

          {steps
            .slice(0, cursor + 1)
            .map((step, i) =>
              step.kind === 'line' ? (
                <LineBubble
                  key={i}
                  step={step}
                  canSpeak={speechStatus === 'ready'}
                  onSpeak={() => speak(step.en)}
                />
              ) : (
                <QuestionCard
                  key={i}
                  step={step}
                  cs={answers[i] ?? null}
                  onSelect={(display) => selectOption(i, display)}
                />
              ),
            )}

          {isLastStep && !needsCheck ? (
            <div className="story-end">
              <Mascot pose="celebrate" />
              <Text variant="section" as="p" className="en">
                Story complete!
              </Text>
              <Text variant="body" className="text-text-2">
                {titleEn}
              </Text>
            </div>
          ) : null}
        </article>
      </div>

      <div className="lesson-foot shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(var(--space-4),env(safe-area-inset-bottom))]">
        {/* An answered check's result + proceed action share this pinned footer
            (never inline in the scroll body, which the footer would occlude). */}
        {topChecked && topQ ? (
          <div className={cn('fb-banner', topCorrect ? 'fb-correct' : 'fb-incorrect')}>
            <div className="fb-mascot">
              <Mascot pose={topCorrect ? 'celebrate' : 'reassure'} />
            </div>
            <div className="fb-text">
              <div className="fb-title en">{topCorrect ? 'Nice!' : 'Not quite'}</div>
              {!topCorrect ? (
                <div className="fb-correct-line">
                  Correct:{' '}
                  <bdi>
                    <b>{topQ.options[topQ.correctIndex]}</b>
                  </bdi>
                </div>
              ) : null}
              <div className="fb-explain fa" dir="rtl">
                {topQ.explanationFa}
              </div>
            </div>
            <div className="fb-action">
              {isLastStep ? (
                <StoryCompleteButton slug={slug} completed={completed} />
              ) : (
                <Button variant="primary" size="lg" onClick={advance}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        ) : needsCheck ? (
          <Button
            variant="confirm"
            size="lg"
            className="w-full"
            disabled={!canConfirm}
            onClick={() => confirmCheck(cursor)}
          >
            Check
          </Button>
        ) : isLastStep ? (
          <StoryCompleteButton slug={slug} completed={completed} />
        ) : (
          <Button variant="primary" size="lg" className="w-full" onClick={advance}>
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
